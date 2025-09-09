'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, WifiOff } from 'lucide-react';
import { db, collection, getDocs } from '@/lib/firebase';
import type { UserData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  useEffect(() => {
    // Fetch all users on component mount
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
        setAllUsers(usersData);
        setDbError(null);
      } catch (error: any) {
        console.error("Firestore connection failed:", error);
        setDbError(`Tidak dapat terhubung ke database. Error: ${error.message}. Pastikan Firestore API aktif dan konfigurasi benar.`);
      }
    };
    fetchUsers();
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
    
    // Client-side user lookup
    const foundUser = allUsers.find(user => user.username.toUpperCase() === username.toUpperCase());

    if (!foundUser) {
      toast({
          variant: 'destructive',
          title: 'Gagal Login',
          description: 'Username tidak ditemukan.',
      });
      setIsLoading(false);
      return;
    }

    if (foundUser.password !== password) {
        toast({
            variant: 'destructive',
            title: 'Gagal Login',
            description: 'Password yang Anda masukkan salah.',
        });
        setIsLoading(false);
        return;
    }
    
    localStorage.setItem('user', JSON.stringify(foundUser));

    toast({
        title: `Selamat Datang, ${foundUser.username}!`,
        description: 'Anda berhasil login.',
    });

    const jabatan = foundUser.jabatan.toUpperCase();
    if (jabatan.includes('SUPER ADMIN')) {
      router.push('/admin');
    } else if (jabatan.includes('ADMIN BP')) {
        router.push('/admin-bp');
    } else if (jabatan.includes('KEPALA WORKSHOP')) {
        router.push('/workshop');
    } else if (jabatan.includes('KEPALA MEKANIK')) {
        router.push('/kepala-mekanik');
    } else if (jabatan.includes('MEKANIK')) {
        router.push('/mekanik');
    } else if (jabatan.includes('SOPIR')) {
        router.push('/sopir');
    } else if (jabatan.includes('QC')) {
        router.push('/qc');
    } else if (jabatan.includes('PEKERJA BONGKAR SEMEN')) {
        router.push('/bongkar-semen');
    } else if (jabatan.includes('ADMIN LOGISTIK MATERIAL')) {
        router.push('/admin-logistik-material');
    } else if (jabatan.includes('OWNER')) {
        router.push('/owner');
    } else if (jabatan.includes('HRD PUSAT')) {
        router.push('/hrd-pusat');
    } else if (jabatan.includes('HSE K3')) {
        router.push('/hse-k3');
    } else {
        router.push('/');
    }

    setIsLoading(false);
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
