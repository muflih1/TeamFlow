import {Button} from '@/components/ui/button';
import {useForm} from '@tanstack/react-form';
import {z} from 'zod';
import {AuthTextInput} from './auth-text-input';
import {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {isAxiosError} from 'axios';
import {CircleAlertIcon} from 'lucide-react';
import {useFadeEffect} from '@/hooks/use-fade-effect';
import {cn} from '@/lib/utils';
import {signIn as signInFn} from '../lib/auth.functions';
import {useServerFn} from '@tanstack/react-start';

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export function SignInForm() {
  const [error, setError] = useState<null | string>(null);
  const signIn = useServerFn(signInFn);

  const {mutate: signInMutationSync} = useMutation({
    mutationFn: (data: FormData) => signIn({data}),
  });

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({value}) => {
      setError(null);
      signInMutationSync(value, {
        onSuccess: () => {
          window.location.replace('/');
        },
        onError: (error: any) => {
          if (isAxiosError(error) && error?.response?.data != null) {
            console.log({error: error.response.data.error_message});
            setError(error.response.data.error_message);
            return;
          }

          setError('Somthing went wrong.');
        },
      });
    },
    onSubmitInvalid: () => {
      const InvalidInput = document.querySelector(
        '[aria-invalid="true"]',
      ) as HTMLInputElement;

      InvalidInput?.focus();
    },
  });

  const [shouldRender, shouldFadeIn, setFadeRef] = useFadeEffect(
    error !== null,
  );

  return (
    <form
      method='POST'
      noValidate
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {shouldRender && (
        <div
          ref={setFadeRef}
          className={cn(
            'bg-destructive/8 p-3 rounded-lg items-center flex gap-x-2 text-sm text-destructive border border-solid border-destructive mb-5 transition-opacity duration-150 opacity-0',
            shouldFadeIn && 'opacity-100',
          )}
        >
          <CircleAlertIcon size={16} />
          <p>{error}</p>
        </div>
      )}
      <div className='space-y-2.5'>
        <form.Field name='email'>
          {field => (
            <AuthTextInput
              valid={field.state.meta.isValid}
              touched={field.state.meta.isTouched}
              error={field.state.meta.errors[0]?.message}
              disabled={form.state.isSubmitting}
              type='email'
              name={field.name}
              value={field.state.value}
              onValueChange={field.handleChange}
              onBlur={field.handleBlur}
              placeholder='Email address'
            />
          )}
        </form.Field>
        <form.Field name='password'>
          {field => (
            <AuthTextInput
              valid={field.state.meta.isValid}
              touched={field.state.meta.isTouched}
              error={field.state.meta.errors[0]?.message}
              disabled={form.state.isSubmitting}
              type='password'
              name={field.name}
              value={field.state.value}
              onValueChange={field.handleChange}
              onBlur={field.handleBlur}
              placeholder='Password'
            />
          )}
        </form.Field>
        <Button type='submit' size='lg' disabled={false} className='w-full'>
          Continue
        </Button>
      </div>
    </form>
  );
}
