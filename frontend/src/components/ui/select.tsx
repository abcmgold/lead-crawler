import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  className?: string
  triggerClassName?: string
  contentClassName?: string
  openDirection?: 'up' | 'down'
}

/**
 * 💡 SIÊU MƯỢT MÀ & KHÔNG LỖI SCROLL (RECOMMENDED)
 * CustomSelect tự viết bằng React State và absolute div thông thường.
 * Giải pháp này mang lại giao diện custom 100% cực đẹp mắt (có checkmark, hover background mịn, hiệu ứng scale mượt),
 * đồng thời tránh được hoàn toàn 100% các lỗi giật cuộn trang (scroll locking) của thư viện Radix UI Portal.
 */
export function CustomSelect({
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder,
  options,
  className,
  triggerClassName,
  contentClassName,
  openDirection = 'down',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || "")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    setSelectedValue(val)
    if (onChange) onChange(val)
    if (onValueChange) onValueChange(val)
    setIsOpen(false)
  }

  const selectedOption = options.find((opt) => opt.value === selectedValue)

  return (
    <div ref={containerRef} className={cn("relative w-full min-w-0", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 cursor-pointer text-left",
          triggerClassName
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className="h-4 w-4 opacity-50 shrink-0 ml-2 transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-slate-950/95 p-1 text-white shadow-2xl backdrop-blur-md animate-scale-in scrollbar-thin",
            openDirection === 'up' ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top",
            contentClassName
          )}
        >
          {options.length === 0 ? (
            <div className="py-2.5 px-4 text-sm text-slate-500 italic">Không có dữ liệu</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === selectedValue
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors duration-200",
                    isSelected && "text-white font-medium bg-white/[0.03]"
                  )}
                >
                  {isSelected && (
                    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
