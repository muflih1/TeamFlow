import {Button} from '@/components/ui/button';
import {useForm} from '@tanstack/react-form';
import {z} from 'zod';
import {AuthTextInput} from './auth-text-input';
import {getAxios} from '@/lib/axios';
import {useMutation} from '@tanstack/react-query';

const schema = z
  .object({
    name: z.string().min(1, {error: 'What\'s your name?'}),
    email: z.email(),
    password: z.string().min(1),
    confirm_password: z.string().min(1),
  })
  .refine(data => data.password === data.confirm_password, {
    path: ['confirm_password'],
    error: 'Password do not match',
  });

type FormData = z.infer<typeof schema>;

export function SignUpForm() {
  const axios = getAxios();

  const {mutate: signUpSync} = useMutation({
    mutationFn: (values: FormData) => axios.post('/auth/sign-up', values),
  });

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
    validators: {
      onChange: schema,
    },
    onSubmit: ({value}) => {
      signUpSync(value, {
        onSuccess: () => {
          window.location.replace('/');
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
      <div className='space-y-2.5'>
        <form.Field name='name'>
          {field => (
            <AuthTextInput
              valid={field.state.meta.isValid}
              touched={field.state.meta.isTouched}
              error={field.state.meta.errors[0]?.message}
              disabled={form.state.isSubmitting}
              type='name'
              name={field.name}
              value={field.state.value}
              onValueChange={field.handleChange}
              onBlur={field.handleBlur}
              placeholder="Full name"
            />
          )}
        </form.Field>
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
        <form.Field name='confirm_password'>
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
              placeholder='Confirm password'
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
