import type React from 'react';
import {useState} from 'react';
import {Tooltip} from './tooltip';
import {Popover, PopoverContent, PopoverTrigger} from './ui/popover';
import EmojiPicker, {
  EmojiStyle,
  Theme,
  type EmojiClickData,
} from 'emoji-picker-react';

type EmojiPickerProps = {
  onEmojiSelect: (emojiClickData: EmojiClickData) => void;
  tooltip: string;
  children: React.ReactElement;
  tooltipProps?: {
    position?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
  };
};

export function EmojiPickerTrigger({
  tooltip,
  tooltipProps,
  children,
  onEmojiSelect,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      tooltip={tooltip}
      position={tooltipProps?.position ?? 'bottom'}
      align={tooltipProps?.align ?? 'center'}
    >
      <span data-slot='tooltip-target-wrapper' className='inline-block'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={children} />
          <PopoverContent className='p-0 w-full border-none shadow-none'>
            <EmojiPicker
              open={open}
              theme={Theme.LIGHT}
              emojiStyle={EmojiStyle.GOOGLE}
              emojiVersion='15.0'
              onEmojiClick={data => {
                onEmojiSelect(data);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </span>
    </Tooltip>
  );
}
