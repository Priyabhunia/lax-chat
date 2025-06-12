import APIKeyForm from '@/frontend/components/APIKeyForm';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { buttonVariants } from '../components/ui/button';
import { ArrowLeftIcon, LogOut, User } from 'lucide-react';
import { useAuth } from '../providers/ConvexAuthProvider';
import { useSidebar } from '../components/ui/sidebar';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("from");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { position } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  // Adjust back button position based on sidebar position
  const backButtonPosition = position === 'right' ? 'right-40' : 'left-40';

  return (
    <section className="flex flex-col w-full h-full">
      <Link
        to={chatId ? `/chat/${chatId}` : "/chat"}
        className={buttonVariants({
          variant: 'default',
          className: `w-fit fixed top-10 ${backButtonPosition} z-10`,
        })}
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Chat
      </Link>
      
      <div className="flex flex-col items-center justify-center w-full h-full gap-8 pt-24 pb-44 mx-auto">
        {/* User Profile Card */}
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Your Profile</CardTitle>
            </div>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              
              {user?.name && (
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full mt-4"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* API Keys Form */}
        <APIKeyForm />
      </div>
    </section>
  );
}
