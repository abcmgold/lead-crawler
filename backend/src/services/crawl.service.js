const axios = require('axios');
const cheerio = require('cheerio');
const { getRandomUserAgent } = require('../utils/userAgent');
const { logSystem } = require('../utils/logger');
const dbRepo = require('../repositories/db.repository');
const leadService = require('./lead.service');

// Target number of unique URLs to collect per crawl run
const MAX_URLS = 250;

// If the search engines return fewer than this many unique URLs, retry the search once more
const MIN_URLS_BEFORE_RETRY = 80;

// Helper to parse DuckDuckGo search result links
// `stats.raw` counts every candidate result link seen (before exact-URL dedup)
function parseDdgResults($, urls, stats = { raw: 0 }) {
  $('a').each((i, el) => {
    let href = $(el).attr('href');
    if (!href) return;

    // Extract real URL from DDG redirect parameters
    if (href.startsWith('/l/?') || href.includes('uddg=')) {
      try {
        const parsedUrl = new URL(href, 'https://html.duckduckgo.com');
        const uddg = parsedUrl.searchParams.get('uddg');
        if (uddg) href = uddg;
      } catch (e) { }
    }

    if (href && href.startsWith('http') && !href.includes('duckduckgo.com') && !href.includes('google.com') && !href.includes('youtube.com') && !href.includes('facebook.com') && !href.includes('twitter.com') && !href.includes('instagram.com')) {
      try {
        new URL(href);
        stats.raw++;
        if (!urls.includes(href)) {
          urls.push(href);
        }
      } catch (e) { }
    }
  });

  // Fallback: parse result__url text if standard href scraping missed it
  $('.result__url').each((i, el) => {
    const targetUrl = $(el).text().trim();
    if (targetUrl && !targetUrl.includes('duckduckgo.com') && !targetUrl.includes('google.com') && !targetUrl.includes('youtube.com') && !targetUrl.includes('facebook.com') && !targetUrl.includes('twitter.com') && !targetUrl.includes('instagram.com')) {
      try {
        const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
        new URL(formattedUrl);
        stats.raw++;
        if (!urls.includes(formattedUrl)) {
          urls.push(formattedUrl);
        }
      } catch (e) { }
    }
  });
}

// Helper to search DuckDuckGo html with multi-page pagination support
async function duckduckgoSearch(query) {
  const urls = [];
  const stats = { raw: 0 };
  try {
    const firstUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    let response = await axios.get(firstUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://duckduckgo.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000,
      // DDG sometimes responds with 202 (anti-bot challenge) but still includes usable results in the body,
      // so don't discard the whole response just because the status isn't a plain 200.
      validateStatus: (status) => status < 500
    });

    let $ = cheerio.load(response.data);
    parseDdgResults($, urls, stats);

    // Fetch subsequent pages (each gives 30 results) using POST requests mimicking the "Next" page form
    for (let page = 1; page <= 9; page++) {
      if (urls.length >= MAX_URLS) break;

      const nextForm = $('form[action="/html/"]').last();
      if (!nextForm.length) break;

      const postData = {};
      nextForm.find('input[type="hidden"]').each((i, el) => {
        const name = $(el).attr('name');
        const value = $(el).attr('value');
        if (name) postData[name] = value;
      });

      // Delay between queries to avoid getting rate limited
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        response = await axios.post('https://html.duckduckgo.com/html/', new URLSearchParams(postData).toString(), {
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Referer': 'https://html.duckduckgo.com/',
            'Origin': 'https://html.duckduckgo.com'
          },
          timeout: 10000
        });

        $ = cheerio.load(response.data);
        parseDdgResults($, urls, stats);
      } catch (err) {
        logSystem(`Lỗi tải trang DDG tiếp theo: ${err.message}`, 'WARNING');
        break;
      }
    }

    logSystem(`DDG: ${stats.raw} link thô tìm thấy, ${urls.length} URL duy nhất`, 'INFO');
    return urls.slice(0, MAX_URLS);
  } catch (err) {
    logSystem(`DuckDuckGo search không khả dụng (bị chặn hoặc hết hạn): ${err.message}`, 'WARNING');
    return [];
  }
}

// Helper to search Bing via scraping with base64 query param decoding (as a second fallback)
async function bingSearch(query) {
  const urls = [];
  let rawCount = 0;
  const userAgent = getRandomUserAgent();
  let nextUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  let cookieHeader = '';

  for (let pageNum = 1; pageNum <= 20; pageNum++) {
    if (!nextUrl || urls.length >= MAX_URLS) break;

    try {
      const response = await axios.get(nextUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
          'Cookie': cookieHeader
        },
        timeout: 10000
      });

      // Extract cookies for subsequent page requests
      const setCookies = response.headers['set-cookie'];
      if (setCookies) {
        cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');
      }

      const $ = cheerio.load(response.data);
      let pageLinksCount = 0;
      let tempNextUrl = '';

      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();

        // Check if this is the link to the next page (e.g. text "2" or "3" or "Tiếp theo" / "Next")
        const targetPageStr = (pageNum + 1).toString();
        if ((text === targetPageStr || text.toLowerCase().includes('tiếp') || text.toLowerCase().includes('next')) && href && href.includes('first=')) {
          tempNextUrl = href.startsWith('http') ? href : `https://www.bing.com${href}`;
        }

        // Parse search results links
        if (href && href.includes('/ck/a')) {
          try {
            const parsedUrl = new URL(href, 'https://www.bing.com');
            const uParam = parsedUrl.searchParams.get('u');
            if (uParam && uParam.startsWith('a1')) {
              const base64Str = uParam.substring(2);
              const normalizedBase64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
              const decodedUrl = Buffer.from(normalizedBase64, 'base64').toString('utf-8');

              if (decodedUrl && decodedUrl.startsWith('http') && !decodedUrl.includes('bing.com') && !decodedUrl.includes('microsoft.com') && !decodedUrl.includes('google.com') && !decodedUrl.includes('youtube.com') && !decodedUrl.includes('facebook.com') && !decodedUrl.includes('twitter.com') && !decodedUrl.includes('instagram.com')) {
                try {
                  new URL(decodedUrl);
                  rawCount++;
                  if (!urls.includes(decodedUrl)) {
                    urls.push(decodedUrl);
                    pageLinksCount++;
                  }
                } catch (e) { }
              }
            }
          } catch (e) { }
        }
      });

      if (pageLinksCount === 0 || !tempNextUrl) {
        break;
      }

      nextUrl = tempNextUrl;
      // Delay slightly between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      logSystem(`Lỗi Bing Search trang ${pageNum}: ${err.stack || err.message}`, 'ERROR');
      console.warn(`Bing blocked search page ${pageNum} or timed out.`, err.message);
      break;
    }
  }

  logSystem(`Bing: ${rawCount} link thô tìm thấy, ${urls.length} URL duy nhất`, 'INFO');
  return urls.slice(0, MAX_URLS);
}

function decodeCfEmail(encodedString) {
  try {
    let email = "";
    const r = parseInt(encodedString.substr(0, 2), 16);
    for (let n = 2; n < encodedString.length; n += 2) {
      const i = parseInt(encodedString.substr(n, 2), 16) ^ r;
      email += String.fromCharCode(i);
    }
    return email.trim();
  } catch (e) {
    return null;
  }
}

function extractContacts(html, info) {
  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,8}/g;
  const emailsFound = html.match(emailRegex);
  if (emailsFound) {
    emailsFound.forEach(email => {
      const cleanEmail = email.toLowerCase().trim();
      const extension = cleanEmail.split('.').pop();
      if (!['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) {
        info.emails.push(cleanEmail);
      }
    });
  }

  // Cloudflare Email Protection decoding
  const cfEmailRegex = /data-cfemail=["']([a-fA-F0-9]+)["']/gi;
  let match;
  while ((match = cfEmailRegex.exec(html)) !== null) {
    const encoded = match[1];
    const decoded = decodeCfEmail(encoded);
    if (decoded) {
      const cleanEmail = decoded.toLowerCase().trim();
      const extension = cleanEmail.split('.').pop();
      if (!['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) {
        info.emails.push(cleanEmail);
      }
    }
  }

  // Generic international phone regex:
  // Matches phone numbers with optional country codes, area codes, and various delimiters (spaces, dots, dashes, parentheses).
  // Uses negative lookbehind/lookahead to avoid matching numbers in decimals or long IDs.
  const phoneRegex = /(?<![\d.,])(?:\+\d{1,3}[ -.]?)?\(?\d{2,5}\)?[ -.]?\d{2,5}[ -.]?\d{2,5}[ -.]?\d{2,9}(?!\d)/g;
  const phonesFound = html.match(phoneRegex);
  if (phonesFound) {
    phonesFound.forEach(phone => {
      // Normalize: strip spaces, dots, dashes, parentheses, keeping digits and '+'
      let cleanPhone = phone.replace(/[^\d+]/g, '');
      if (cleanPhone.startsWith('+84')) {
        cleanPhone = '0' + cleanPhone.slice(3);
      }
      // Allow any phone numbers between 8 and 15 digits
      if (/^\+?\d{8,15}$/.test(cleanPhone)) {
        info.phones.push(cleanPhone);
      }
    });
  }
}

// Helper to crawl a specific website
async function crawlWebsite(targetUrl) {
  const info = {
    url: targetUrl,
    title: '',
    emails: [],
    phones: [],
    status: 'failed',
    message: ''
  };

  try {
    const mainPageRes = await axios.get(targetUrl, {
      headers: { 'User-Agent': getRandomUserAgent() },
      timeout: 8000,
      validateStatus: () => true,
      // Keep the raw response body as a string even if it looks like JSON
      transformResponse: (data) => data
    });

    if (mainPageRes.status !== 200) {
      info.message = `HTTP Status ${mainPageRes.status}`;
      return info;
    }

    const html = mainPageRes.data;
    const $ = cheerio.load(html);

    // Get Title
    info.title = $('title').text().trim() || $('meta[property="og:site_name"]').attr('content') || new URL(targetUrl).hostname;

    // Search email and phone numbers on current page
    extractContacts(html, info);

    // Smart Crawl: Search for Contact page link
    const contactLinks = [];
    $('a').each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href');
      if (!href) return;

      if (
        text.includes('liên hệ') ||
        text.includes('contact') ||
        text.includes('giới thiệu') ||
        text.includes('about') ||
        href.includes('contact') ||
        href.includes('lien-he') ||
        href.includes('about')
      ) {
        try {
          const absoluteUrl = new URL(href, targetUrl).href;
          if (!contactLinks.includes(absoluteUrl) && absoluteUrl !== targetUrl) {
            contactLinks.push(absoluteUrl);
          }
        } catch (e) { }
      }
    });

    // Crawl first found contact page as well
    if (contactLinks.length > 0) {
      try {
        const contactPageRes = await axios.get(contactLinks[0], {
          headers: { 'User-Agent': getRandomUserAgent() },
          timeout: 6000,
          validateStatus: () => true,
          transformResponse: (data) => data
        });
        if (contactPageRes.status === 200) {
          extractContacts(contactPageRes.data, info);
        }
      } catch (e) {
        // Ignore contact page failure, stick to home page results
      }
    }

    // Process and filter results
    info.emails = [...new Set(info.emails)];
    info.phones = [...new Set(info.phones)];

    if (info.emails.length > 0 || info.phones.length > 0) {
      info.status = 'success';
    } else {
      info.status = 'no_contacts';
      info.message = 'Không tìm thấy Email/Số điện thoại';
    }

  } catch (err) {
    logSystem(`Lỗi khi truy cập/cào trang ${targetUrl}: ${err.stack || err.message}`, 'ERROR');
    info.message = err.message;
  }

  return info;
}

// Helper to check if input is a direct domain, email, or URL, and return clean URL
function getDirectUrl(input) {
  let cleaned = input.trim().toLowerCase();

  // If email, extract domain
  if (cleaned.includes('@')) {
    const parts = cleaned.split('@');
    cleaned = parts[parts.length - 1];
  }

  // If it's a domain/URL (has dot, no spaces)
  if (!cleaned.includes(' ') && cleaned.includes('.')) {
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      return `https://${cleaned}`;
    }
    return cleaned;
  }

  return null;
}

// Orchestrates a full search+crawl run for a keyword/URL, persisting new leads and a history log entry
async function performCrawl(keyword) {
  logSystem(`Yêu cầu cào dữ liệu bắt đầu. Từ khóa/URL: "${keyword}"`, 'INFO');
  let urls = [];
  const directUrl = getDirectUrl(keyword);

  if (directUrl) {
    logSystem(`Phát hiện đầu vào là URL/Email. Crawl trực tiếp: ${directUrl}`, 'INFO');
    urls = [directUrl];
  } else {
    const addUrls = (newUrls) => {
      for (const url of newUrls) {
        try {
          new URL(url);
          if (!urls.includes(url) && urls.length < MAX_URLS) {
            urls.push(url);
          }
        } catch (e) { }
      }
    };

    // 1. Try Bing first (currently the most reliable/productive source)
    const bingUrls = await bingSearch(keyword);
    logSystem(`Bing trả về ${bingUrls.length} URL`, 'INFO');
    addUrls(bingUrls);

    // 2. If we need more, try DuckDuckGo (up to 9 pages)
    if (urls.length < MAX_URLS) {
      logSystem(`Sau Bing: ${urls.length} kết quả. Tiếp tục tìm thêm từ DuckDuckGo...`, 'INFO');
      const ddgUrls = await duckduckgoSearch(keyword);
      logSystem(`DuckDuckGo trả về ${ddgUrls.length} URL`, 'INFO');
      addUrls(ddgUrls);
    }

    // 3. If results are still too few (engines likely got rate-limited/blocked), retry once
    if (urls.length < MIN_URLS_BEFORE_RETRY) {
      logSystem(`Chỉ tìm được ${urls.length} URL (dưới ngưỡng ${MIN_URLS_BEFORE_RETRY}). Thử tìm lại lần 2...`, 'WARNING');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const bingRetryUrls = await bingSearch(keyword);
      logSystem(`Bing (lần 2) trả về ${bingRetryUrls.length} URL`, 'INFO');
      addUrls(bingRetryUrls);

      if (urls.length < MAX_URLS) {
        const ddgRetryUrls = await duckduckgoSearch(keyword);
        logSystem(`DuckDuckGo (lần 2) trả về ${ddgRetryUrls.length} URL`, 'INFO');
        addUrls(ddgRetryUrls);
      }
    }

    logSystem(`Tổng số website thu thập được cho "${keyword}": ${urls.length} URLs (sau khi lọc trùng URL giữa các engine)`, 'INFO');
  }

  if (urls.length === 0) {
    logSystem(`Không tìm thấy kết quả nào cho từ khóa: "${keyword}"`, 'WARNING');
    return { success: true, message: 'Không tìm thấy kết quả nào.', results: [] };
  }

  const logId = '_' + Math.random().toString(36).substr(2, 9);
  const results = [];
  let newLeadsCount = 0;

  // Retrieve all existing emails in the database before starting the crawl session
  const existingEmails = new Set((await dbRepo.getLeads()).map(l => l.email.toLowerCase()));
  const addedInSession = new Set();

  // Crawl websites concurrently in parallel batches (concurrency: 15) to speed up drastically and prevent HTTP timeouts
  const concurrencyLimit = 15;
  const queue = [...urls];
  
  const workers = Array(Math.min(concurrencyLimit, queue.length)).fill(null).map(async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        const crawled = await crawlWebsite(url);
        results.push(crawled);
        logSystem(`Crawl website: ${url} | Trạng thái: ${crawled.status} | Emails tìm thấy: ${crawled.emails.length}`, 'INFO');

        if (crawled.status === 'success') {
          const added = await leadService.addLeadsFromCrawl(crawled, keyword, logId, existingEmails, addedInSession);
          newLeadsCount += added;
        }
      } catch (err) {
        logSystem(`Lỗi khi cào URL ${url}: ${err.message}`, 'WARNING');
      }
    }
  });

  await Promise.all(workers);

  await dbRepo.addLog({
    id: logId,
    keyword,
    timestamp: new Date().toISOString(),
    urlsCount: urls.length,
    newLeadsCount
  });

  logSystem(`Hoàn tất cào cho từ khóa: "${keyword}". Thêm mới ${newLeadsCount} Leads vào CSDL.`, 'INFO');

  return { success: true, count: results.length, newLeadsCount, results };
}


module.exports = {
  duckduckgoSearch,
  bingSearch,
  crawlWebsite,
  extractContacts,
  getDirectUrl,
  performCrawl
};
