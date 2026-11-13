import { AnimationOutlet } from 'components';

type AuthLayoutProps = Record<string, never>;

const AuthLayout: React.FC<AuthLayoutProps> = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <AnimationOutlet />
      </div>
    </div>
  );
};

export default AuthLayout;
