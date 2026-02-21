import { Navbar } from '../../components/layout/Navbar';
import { SignupForm } from '../../components/auth/SignupForm';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-rs-sand-light flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-5 py-24 sm:py-16">
        <SignupForm />
      </div>
    </main>
  );
}