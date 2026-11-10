import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
    value: string | number;
    label: string;
}

interface DropdownProps {
    value: string | number;
    onChange: (value: any) => void;
    options: Option[];
    className?: string;
    menuClassName?: string;
}

export default function Dropdown({ value, onChange, options, className, menuClassName }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    const handleToggle = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            setOpenUpward(spaceBelow < 280 && spaceAbove > spaceBelow);
        }
        setIsOpen((prev) => !prev);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const updateDirection = () => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                setOpenUpward(spaceBelow < 280 && spaceAbove > spaceBelow);
            };
            updateDirection();
            window.addEventListener("resize", updateDirection);
            return () => {
                window.removeEventListener("resize", updateDirection);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && menuRef.current) {
            const container = menuRef.current;
            const selectedElement = container.querySelector('[data-selected="true"]') as HTMLElement;
            if (selectedElement) {
                const timeoutId = setTimeout(() => {
                    const containerRect = container.getBoundingClientRect();
                    const selectedRect = selectedElement.getBoundingClientRect();
                    const relativeTop = selectedRect.top - containerRect.top + container.scrollTop;
                    container.scrollTop = relativeTop - (container.clientHeight / 2) + (selectedElement.clientHeight / 2);
                }, 50);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={handleToggle}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={cn(
                    "bg-white/[0.08] hover:bg-white/[0.14] text-white h-11 px-5 rounded-full font-semibold flex items-center gap-3 border border-white/10 hover:border-white/20 text-sm select-none",
                    className
                )}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown className={cn("w-4 h-4 text-muted", isOpen && "rotate-180")} />
            </button>

            <>
                {isOpen && (
                    <div
                        ref={menuRef}
                        className={cn(
                            "absolute left-0 min-w-[180px] max-h-72 sm:max-h-80 overflow-y-auto overscroll-contain bg-surface-2/95 border border-line rounded-2xl p-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] z-[100] focus:outline-none dropdown-scrollbar",
                            openUpward ? "bottom-full mb-2 origin-bottom-left" : "top-full mt-2 origin-top-left",
                            menuClassName
                        )}
                        style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "rgba(255, 255, 255, 0.25) transparent"
                        }}
                    >
                        <div className="space-y-0.5" role="listbox">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        data-selected={isSelected}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between select-none",
                                            isSelected
                                                ? "bg-white/10 text-white font-semibold"
                                                : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                                        )}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && <Check className="w-4 h-4 shrink-0 ml-2 stroke-[2.5] text-accent" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </>
        </div>
    );
}
