import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, Trash2, Code, FileText } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCodeView, setIsCodeView] = useState(false);

  const lastValueRef = useRef(value);

  // Sync value from prop to innerHTML on mount or when value changes externally
  useEffect(() => {
    if (!isCodeView && editorRef.current) {
      if (value !== lastValueRef.current) {
        editorRef.current.innerHTML = value || '';
        lastValueRef.current = value;
      }
    }
  }, [value, isCodeView]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
  };

  const execCommand = (command: string, val: string = '') => {
    if (disabled || isCodeView) return;
    document.execCommand(command, false, val);
    handleInput();
  };

  const insertHtmlAtCursor = (html: string) => {
    if (disabled || isCodeView) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
        handleInput();
      }
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const el = document.createElement("div");
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.setEndAfter(lastNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      handleInput();
    } catch (err) {
      // Fallback if selection is not active inside the editor
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
        handleInput();
      }
    }
  };

  const handleInsertLink = () => {
    const url = prompt("Nhập đường dẫn URL (ví dụ: https://example.com):");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        insertHtmlAtCursor(`<img src="${base64Url}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 8px 0; border-radius: 8px; display: block;" />`);
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInsertImageLink = () => {
    const url = prompt("Nhập URL hình ảnh trực tiếp (ví dụ: https://example.com/image.jpg):");
    if (url) {
      insertHtmlAtCursor(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto; margin: 8px 0; border-radius: 8px;" />`);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border border-white/10 overflow-hidden bg-slate-950/40 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 bg-slate-900/60 border-b border-white/5 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text formatting */}
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Bôi đậm"
            disabled={isCodeView}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="In nghiêng"
            disabled={isCodeView}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Gạch chân"
            disabled={isCodeView}
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Danh sách dấu chấm"
            disabled={isCodeView}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Danh sách số"
            disabled={isCodeView}
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Link & Image */}
          <button
            type="button"
            onClick={handleInsertLink}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Chèn link liên kết"
            disabled={isCodeView}
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Chèn ảnh từ máy tính"
            disabled={isCodeView}
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertImageLink}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Chèn ảnh bằng link URL"
            disabled={isCodeView}
          >
            <span className="text-[10px] font-bold">URL</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Reset format */}
          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            className={`p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer ${isCodeView ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Xóa định dạng"
            disabled={isCodeView}
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {/* Dynamic Placeholders */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-slate-500 mr-1 hidden sm:inline">Chèn thẻ động:</span>
          <button
            type="button"
            onClick={() => isCodeView ? onChange(value + '{{Name}}') : insertHtmlAtCursor('{{Name}}')}
            className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary/20 transition-all cursor-pointer"
          >
            Tên
          </button>
          <button
            type="button"
            onClick={() => isCodeView ? onChange(value + '{{Website}}') : insertHtmlAtCursor('{{Website}}')}
            className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary/20 transition-all cursor-pointer"
          >
            Website
          </button>
          
          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          {/* Code View Toggle */}
          <button
            type="button"
            onClick={() => setIsCodeView(!isCodeView)}
            className={`p-2 rounded-lg transition-all cursor-pointer ${isCodeView ? 'text-primary bg-primary/10 border border-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title={isCodeView ? "Xem chế độ soạn thảo" : "Xem chế độ code HTML"}
          >
            {isCodeView ? <FileText className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {isCodeView ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-950/80 p-4 min-h-[260px] text-sm text-slate-200 font-mono focus:outline-none resize-y"
          placeholder="Nhập mã HTML..."
        />
      ) : (
        <div className="relative w-full min-h-[260px] max-h-[500px]">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="w-full min-h-[260px] max-h-[500px] overflow-y-auto p-4 text-sm text-white focus:outline-none bg-slate-950/20 font-sans prose prose-invert max-w-none rich-text-editor-content"
            style={{ wordBreak: 'break-word' }}
          />
          {!value && (
            <div className="absolute top-4 left-4 text-slate-600 text-sm pointer-events-none font-sans select-none whitespace-pre-wrap max-w-[calc(100%-2rem)]">
              {placeholder || "Soạn nội dung email ở đây..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
