import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarClock, Clock3, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const hours = Array.from({ length: 24 }, (_, hour) => `${hour}`.padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, minute) => `${minute}`.padStart(2, "0"));

type DateTimePickerProps = {
  className?: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  onBlur?: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  value?: string;
};

const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(
  function DateTimePicker(
    { className, disabled, id, invalid, onBlur, onChange, placeholder = "选择日期和时间", value },
    ref,
  ) {
    const [open, setOpen] = React.useState(false);
    const selectedDate = React.useMemo(() => parseDateTimeValue(value), [value]);
    const currentYear = new Date().getFullYear();

    const updateOpen = (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        onBlur?.();
      }
    };

    const selectDate = (date: Date | undefined) => {
      if (!date) {
        onChange("");
        return;
      }
      const time = selectedDate ?? new Date();
      date.setHours(time.getHours(), time.getMinutes(), 0, 0);
      onChange(formatDateTimeValue(date));
    };

    const selectHour = (hour: string) => {
      if (!selectedDate) {
        return;
      }
      const nextDate = new Date(selectedDate);
      nextDate.setHours(Number(hour));
      onChange(formatDateTimeValue(nextDate));
    };

    const selectMinute = (minute: string) => {
      if (!selectedDate) {
        return;
      }
      const nextDate = new Date(selectedDate);
      nextDate.setMinutes(Number(minute));
      onChange(formatDateTimeValue(nextDate));
    };

    return (
      <Popover open={open} onOpenChange={updateOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            className={cn(
              "w-full justify-start font-normal",
              !selectedDate && "text-muted-foreground",
              className,
            )}
          >
            <CalendarClock className="size-4" />
            <span className="min-w-0 flex-1 truncate text-left">
              {selectedDate
                ? format(selectedDate, "yyyy 年 MM 月 dd 日 HH:mm", { locale: zhCN })
                : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selectedDate}
            defaultMonth={selectedDate}
            startMonth={new Date(currentYear - 10, 0)}
            endMonth={new Date(currentYear + 30, 11)}
            locale={zhCN}
            onSelect={selectDate}
          />
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <Clock3 className="mb-2.5 size-4 text-muted-foreground" />
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs">小时</span>
                <Select
                  value={selectedDate ? `${selectedDate.getHours()}`.padStart(2, "0") : ""}
                  disabled={!selectedDate}
                  onValueChange={selectHour}
                >
                  <SelectTrigger className="w-20" aria-label="小时">
                    <SelectValue placeholder="时" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="pb-2 font-medium text-muted-foreground">:</span>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs">分钟</span>
                <Select
                  value={selectedDate ? `${selectedDate.getMinutes()}`.padStart(2, "0") : ""}
                  disabled={!selectedDate}
                  onValueChange={selectMinute}
                >
                  <SelectTrigger className="w-20" aria-label="分钟">
                    <SelectValue placeholder="分" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!selectedDate}
                onClick={() => onChange("")}
              >
                <X className="size-4" />
                清空
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!selectedDate}
                onClick={() => updateOpen(false)}
              >
                完成
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

function parseDateTimeValue(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    return undefined;
  }
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day) ||
    date.getHours() !== Number(hour) ||
    date.getMinutes() !== Number(minute)
  ) {
    return undefined;
  }
  return date;
}

function formatDateTimeValue(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hour = `${value.getHours()}`.padStart(2, "0");
  const minute = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export { DateTimePicker };
