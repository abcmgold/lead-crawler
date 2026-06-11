const axios = require('axios');
const cheerio = require('cheerio');
const { getRandomUserAgent } = require('../utils/userAgent');
const { logSystem } = require('../utils/logger');
const dbRepo = require('../repositories/db.repository');
const leadService = require('./lead.service');

// Helper to search DuckDuckGo html as a fallback
async function duckduckgoSearch(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const urls = [];

    // Parse search results links
    $('.result__url').each((i, el) => {
      const targetUrl = $(el).text().trim();
      if (targetUrl && !targetUrl.includes('duckduckgo.com') && !targetUrl.includes('google.com') && !targetUrl.includes('youtube.com') && !targetUrl.includes('facebook.com') && !targetUrl.includes('twitter.com') && !targetUrl.includes('instagram.com')) {
        try {
          const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
          const parsed = new URL(formattedUrl);
          if (!urls.some(u => new URL(u).hostname === parsed.hostname)) {
            urls.push(formattedUrl);
          }
        } catch (e) { }
      }
    });

    return urls.slice(0, 40);
  } catch (err) {
    console.error('Lỗi DuckDuckGo search:', err.message);
    return [];
  }
}

// Helper to search Google via scraping (falls back to DuckDuckGo if blocked/empty)
async function googleSearch(query) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=45`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const urls = [];

    // Parse links from Google search result page
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      let targetUrl = '';
      if (href.startsWith('/url?q=')) {
        const rawUrl = href.split('/url?q=')[1].split('&')[0];
        targetUrl = decodeURIComponent(rawUrl);
      } else if (href.startsWith('http')) {
        targetUrl = href;
      }

      if (targetUrl && !targetUrl.includes('google.com') && !targetUrl.includes('youtube.com') && !targetUrl.includes('facebook.com') && !targetUrl.includes('twitter.com') && !targetUrl.includes('instagram.com')) {
        try {
          const parsed = new URL(targetUrl);
          if (!urls.some(u => new URL(u).hostname === parsed.hostname)) {
            urls.push(targetUrl);
          }
        } catch (e) { }
      }
    });

    if (urls.length > 0) {
      return urls.slice(0, 40);
    }
  } catch (err) {
    logSystem(`Lỗi Google Search: ${err.stack || err.message}`, 'ERROR');
    console.warn('Google blocked search request. Falling back to DuckDuckGo...', err.message);
  }

  return await duckduckgoSearch(query);
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

  // Stricter Vietnam phone regex:
  // - Exactly 10 digits starting with 03x, 05x, 07x, 08x, 09x (mobile)
  // - OR landline: 02x + 8 digits  (e.g. 0287654321)
  // - OR +84 prefix followed by 9 digits
  // Uses word boundaries / context to avoid matching floating-point numbers in JS/CSS
  const phoneRegex = /(?<![\d.,])(?:\+84|0)(?:(?:3[2-9]|5[6-9]|7[0-9]|8[0-9]|9[0-9])\d{7}|(?:2[0-9])\d{8})(?![\d.])/g;
  const phonesFound = html.match(phoneRegex);
  if (phonesFound) {
    phonesFound.forEach(phone => {
      // Normalize: strip spaces/dots/dashes, convert +84xxx → 0xxx
      let cleanPhone = phone.replace(/[\s.-]/g, '');
      if (cleanPhone.startsWith('+84')) {
        cleanPhone = '0' + cleanPhone.slice(3);
      }
      // Must be exactly 10 digits after normalization
      if (/^0\d{9}$/.test(cleanPhone)) {
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
      validateStatus: () => true
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
          validateStatus: () => true
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
    urls = await googleSearch(keyword);
    logSystem(`Kết quả tìm kiếm cho "${keyword}" trả về ${urls.length} URLs`, 'INFO');
  }

  if (urls.length === 0) {
    logSystem(`Không tìm thấy kết quả nào cho từ khóa: "${keyword}"`, 'WARNING');
    return { success: true, message: 'Không tìm thấy kết quả nào.', results: [] };
  }

  const results = [];
  let newLeadsCount = 0;

  for (const url of urls) {
    const crawled = await crawlWebsite(url);
    results.push(crawled);
    logSystem(`Crawl website: ${url} | Trạng thái: ${crawled.status} | Emails tìm thấy: ${crawled.emails.length}`, 'INFO');

    if (crawled.status === 'success') {
      newLeadsCount += await leadService.addLeadsFromCrawl(crawled, keyword);
    }
  }

  await dbRepo.addLog({
    id: '_' + Math.random().toString(36).substr(2, 9),
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
  googleSearch,
  crawlWebsite,
  extractContacts,
  getDirectUrl,
  performCrawl
};
