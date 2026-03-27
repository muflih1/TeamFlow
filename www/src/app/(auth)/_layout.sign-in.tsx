import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Separator} from '@/components/ui/separator';
import {SignInForm} from '@/features/auth/components/sign-in-form';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)/_layout/sign-in')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card className='w-full h-full p-8'>
      <CardHeader>
        <CardTitle className='text-lg font-bold'>Login to continue</CardTitle>
        <CardDescription>
          Use your email or another service to continue
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5 pb-0'>
        <SignInForm />
        <Separator orientation='horizontal' />
        <div className='flex flex-col gap-y-2.5'>
          <Button
            disabled={false}
            onClick={() => {}}
            variant='outline'
            size='lg'
            className='w-full relative'
          >
            Continue with Google
          </Button>
          <Button
            disabled={false}
            onClick={() => {}}
            variant='outline'
            size='lg'
            className='w-full relative'
          >
            Continue with Github
          </Button>
        </div>
        <p className='text-sm text-muted-foreground'>
          Don&apos;t have an account?&nbsp;
          <Route.Link
            to='/sign-up'
            className='text-sky-700 font-medium select-none hover:underline text-sm touch-manipulation'
          >
            Sign up
          </Route.Link>
        </p>
      </CardContent>
    </Card>
  );
}
