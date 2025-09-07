'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, WifiOff } from 'lucide-react';
import { db, collection, query, where, getDocs, limit } from '@/lib/firebase';
import type { UserData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    // Check Firestore connection on page load
    const checkConnection = async () => {
      try {
        await getDocs(query(collection(db, 'users'), limit(1)));
        setDbError(null);
      } catch (error: any) {
        console.error("Firestore connection failed:", error);
        setDbError(`Tidak dapat terhubung ke database. Error: ${error.message}. Pastikan Firestore API aktif dan konfigurasi benar.`);
      }
    };
    checkConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (dbError) {
        toast({
            variant: 'destructive',
            title: 'Koneksi Gagal',
            description: 'Tidak dapat melanjutkan karena koneksi ke database bermasalah.',
        });
        setIsLoading(false);
        return;
    }

    if (!username || !password) {
        toast({
            variant: 'destructive',
            title: 'Input Tidak Lengkap',
            description: 'Username dan password harus diisi.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const q = query(collection(db, "users"), where("username", "==", username.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({
                variant: 'destructive',
                title: 'Gagal Login',
                description: 'Username tidak ditemukan.',
            });
            setIsLoading(false);
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as UserData;

        if (userData.password !== password) {
            toast({
                variant: 'destructive',
                title: 'Gagal Login',
                description: 'Password yang Anda masukkan salah.',
            });
            setIsLoading(false);
            return;
        }
        
        localStorage.setItem('user', JSON.stringify(userData));

        toast({
            title: `Selamat Datang, ${userData.username}!`,
            description: 'Anda berhasil login.',
        });

        const jabatan = userData.jabatan.toUpperCase();
        if (jabatan === 'SUPER ADMIN') {
            router.push('/admin');
        } else {
             router.push('/');
        }

    } catch (error) {
        console.error("Login Error:", error);
        setDbError(`Error saat login: ${error}`);
        toast({ variant: 'destructive', title: 'Terjadi Kesalahan', description: 'Gagal memverifikasi pengguna. Coba lagi.' });
        setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className='relative h-16 w-full mx-auto mb-4'>
                <Image src="https://i.imgur.com/CxaNLPj.png" alt="Logo" fill style={{objectFit: 'contain'}} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority data-ai-hint="logo company"/>
            </div>
            <CardTitle className="text-xl font-bold tracking-wider whitespace-nowrap">PT FARIKA RIAU PERKASA</CardTitle>
            <CardDescription className="text-muted-foreground pt-1">Silakan masuk untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          {dbError && (
             <Alert variant="destructive" className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Koneksi Database Bermasalah</AlertTitle>
              <AlertDescription>
                {dbError}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                placeholder="Username"
                required
                className="pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full font-semibold tracking-wide" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
