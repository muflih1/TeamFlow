import {Input} from '@/components/ui/input';
import type React from 'react';
import {useId} from 'react';

interface Props extends React.ComponentProps<'input'> {
  valid: boolean;
  touched: boolean;
  error?: string;
  onValueChange?: (
    value: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}

export function AuthTextInput({
  touched,
  valid,
  error,
  type = 'text',
  name,
  value,
  onChange,
  onValueChange,
  onBlur,
  disabled = false,
  ...props
}: Props) {
  const id = useId();
  const describedby = useId();

  return (
    <div className='relative z-0 box-border'>
      <Input
        id={id}
        type={type}
        disabled={disabled}
        name={name}
        value={value}
        onChange={composeEventHandler(onChange, e => {
          if (onValueChange) {
            onValueChange(e.target.value, e);
          }
        })}
        onBlur={onBlur}
        {...(!valid &&
          touched && {
            'aria-invalid': true,
            'aria-describedby': describedby,
          })}
        {...props}
      />

      {!valid && touched && error != null && (
        <div id={describedby} className='mt-1 text-destructive'>
          {error}
        </div>
      )}
    </div>
  );
}

function composeEventHandler<E extends {defaultPrevented: boolean}>(
  originalHandler?: (event: E) => void,
  ourHandler?: (event: E) => void,
) {
  return function handlerEvent(event: E) {
    originalHandler?.(event);
    if (!event.defaultPrevented) {
      return ourHandler?.(event);
    }
  };
}
