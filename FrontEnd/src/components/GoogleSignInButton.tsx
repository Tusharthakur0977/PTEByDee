import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { FC } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GoogleSignInButton: FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const { googleSignIn } = useAuth();

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    try {
      if (credentialResponse.credential) {
        const success = await googleSignIn(credentialResponse.credential);
        if (success) {
          onSuccess?.();
        } else {
          onError?.('Google sign-in failed. Please try again.');
        }
      } else {
        onError?.('No credential received from Google.');
      }
    } catch (error) {
      onError?.('Google sign-in failed. Please try again.');
    }
  };

  const handleError = () => {
    onError?.('Google sign-in failed. Please try again.');
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className='w-full flex justify-center'>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme='outline'
          size='large'
          width='100%'
          text='signin_with'
          shape='rectangular'
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleSignInButton;
