
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, LogOut, User, Lock, Briefcase, Fingerprint, MapPin, Trash2, Users, Construction, Pencil, X, Loader2, GitCompareArrows, LocateFixed, Save } from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import type { UserData as AppUserData, LocationData as AppLocationData } from '@/lib/types';
import { db, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from '@/lib/firebase';

interface UserData extends AppUserData {
  id: string;
}

interface AlatData {
    id: string;
    nomorLambung: string;
    nomorPolisi: string;
    jenisKendaraan: string;
    lokasi: string;
}

interface LocationData extends AppLocationData {
    id: string;
}

type ActiveMenu = 'pengguna' | 'alat' | 'lokasi' | 'sinkronisasi' | 'koordinat';

const jabatanOptions = [
    'OPRATOR BP', 'OPRATOR CP', 'OPRATOR LOADER', 'PEKERJA BONGKAR SEMEN', 'SOPIR', 'SOPIR DT', 'ADMIN BP', 'ADMIN LOGISTIK SPARE PART',
    'ADMIN LOGISTIK MATERIAL', 'SUPER ADMIN', 'QC', 'MARKETING', 'KEPALA MEKANIK', 'KEPALA WORKSHOP', 'OWNER', 'HRD PUSAT', 'HSE K3'
];

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [alat, setAlat] = useState<AlatData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('pengguna');
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNik, setNewNik] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newLokasi, setNewLokasi] = useState('');

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingAlat, setEditingAlat] = useState<AlatData | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'user' | 'alat' | 'lokasi' } | null>(null);
  
  const memoizedUser = useMemo(() => {
    if (typeof window !== 'undefined') {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    }
    return null;
  }, []);

  useEffect(() => {
    if (!memoizedUser) {
      router.push('/login');
      return;
    }
    if (memoizedUser.jabatan.toUpperCase() !== 'SUPER ADMIN') {
        toast({
            variant: 'destructive',
            title: 'Akses Ditolak',
            description: 'Anda tidak memiliki hak untuk mengakses halaman ini.',
        });
        router.push('/login');
        return;
    }
    setCurrentUser(memoizedUser);
  }, [memoizedUser, router, toast]);
  
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
        setIsDataLoading(true);
        try {
            const usersQuery = getDocs(collection(db, 'users'));
            const alatQuery = getDocs(collection(db, 'alat'));
            const locationsQuery = getDocs(collection(db, 'locations'));

            const [usersSnapshot, alatSnapshot, locationsSnapshot] = await Promise.all([usersQuery, alatQuery, locationsQuery]);

            setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserData[]);
            setAlat(alatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AlatData[]);
            setLocations(locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LocationData[]);

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            toast({ variant: "destructive", title: "Gagal memuat data", description: "Tidak dapat mengambil data dari Firestore." });
        }
        setIsDataLoading(false);
    };
    fetchData();

  }, [currentUser, toast]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);

    const newUser: Omit<UserData, 'id'> = {
      username: newUsername.toUpperCase(),
      password: newPassword,
      nik: newNik.toUpperCase(),
      jabatan: newJabatan,
      lokasi: newLokasi,
      role: newUsername.toLowerCase() === 'admin' ? 'admin' : 'user',
    };
    
    try {
        const docRef = await addDoc(collection(db, 'users'), newUser);
        setUsers(prev => [...prev, { ...newUser, id: docRef.id }]);
        toast({ title: 'Pengguna Ditambahkan', description: `Pengguna ${newUser.username} berhasil dibuat.` });
        setNewUsername(''); setNewPassword(''); setNewNik(''); setNewJabatan(''); setNewLokasi('');
    } catch (error) {
        console.error("Error adding user:", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menambahkan pengguna baru.' });
    }
    setIsActionLoading(false);
  };
  
  const handleEditUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;
    setIsActionLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const updatedUserData: Partial<UserData> = {
      username: (formData.get('editUsername') as string).toUpperCase(),
      nik: (formData.get('editNik') as string).toUpperCase(),
      jabatan: formData.get('editJabatan') as string,
      lokasi: formData.get('editLokasi') as string,
    };
    const newPassword = formData.get('editPassword') as string;
    if (newPassword) {
      updatedUserData.password = newPassword;
    }
    
    try {
        const userDocRef = doc(db, 'users', editingUser.id);
        await updateDoc(userDocRef, updatedUserData);
        setUsers(prev => prev.map(user => user.id === editingUser.id ? { ...user, ...updatedUserData } : user));
        toast({ title: 'Pengguna Diperbarui', description: `Data untuk ${updatedUserData.username} berhasil diperbarui.` });
        setEditingUser(null);
    } catch (error) {
        console.error("Error updating user:", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memperbarui data pengguna.' });
    }
    setIsActionLoading(false);
  }

  const handleDeleteRequest = (id: string, name: string, type: 'user' | 'alat' | 'lokasi') => {
    setItemToDelete({ id, name, type });
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { id, type, name } = itemToDelete;

    try {
        await deleteDoc(doc(db, type === 'user' ? 'users' : type === 'alat' ? 'alat' : 'locations', id));
        if (type === 'alat') setAlat(prev => prev.filter(item => item.id !== id));
        if (type === 'user') setUsers(prev => prev.filter(user => user.id !== id));
        if (type === 'lokasi') setLocations(prev => prev.filter(item => item.id !== id));
        toast({ title: 'Item Dihapus', description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${name} telah dihapus.` });
    } catch (error) {
        console.error("Error deleting item:", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus item.' });
    }

    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
    if (!currentUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <>
     <SidebarProvider>
      <Sidebar>
        <SidebarContent>
            <SidebarHeader>
                <h2 className="text-xl font-semibold text-primary">Dasbor Admin</h2>
            </SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeMenu === 'pengguna'} onClick={() => setActiveMenu('pengguna')}>
                        <Users />
                        Manajemen Pengguna
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
         <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <SidebarTrigger/>
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider">Manajemen Pengguna</h1>
                        <p className="text-muted-foreground">
                            Selamat datang, <span className="font-semibold text-primary">{currentUser?.username || 'Admin'}</span> ({currentUser?.jabatan})
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
                </Button>
            </header>

            {isDataLoading ? (
                 <div className="flex min-h-[50vh] items-center justify-center bg-background">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            ) : (
             <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <UserPlus />
                            Tambah Pengguna Baru
                        </CardTitle>
                        <CardDescription>Buat akun baru untuk karyawan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <form onSubmit={handleAddUser} className="space-y-6">
                            <div className="space-y-2">
                            <Label htmlFor="username" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Nama Pengguna
                            </Label>
                            <Input id="username" name="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="cth: operator_baru" required style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Sandi
                            </Label>
                            <Input id="password" name="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="nik" className="flex items-center gap-2">
                                <Fingerprint className="h-4 w-4" />
                                NIK
                            </Label>
                            <Input id="nik" name="nik" value={newNik} onChange={(e) => setNewNik(e.target.value)} placeholder="cth: 1234567890" required style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="jabatan" className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                Jabatan
                            </Label>
                            <Select name="jabatan" onValueChange={setNewJabatan} value={newJabatan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jabatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jabatanOptions.map(jabatan => (
                                        <SelectItem key={jabatan} value={jabatan}>
                                            {jabatan}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lokasi" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Lokasi
                                </Label>
                                <Select name="lokasi" onValueChange={setNewLokasi} value={newLokasi}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih lokasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.name}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full font-semibold tracking-wide" disabled={isActionLoading}>
                                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Tambah Pengguna'}
                            </Button>
                        </form>
                        </CardContent>
                    </Card>
                    </div>
                    <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                        <CardTitle>Daftar Pengguna</CardTitle>
                        <CardDescription>Daftar semua akun pengguna yang terdaftar di sistem.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Nama Pengguna</TableHead>
                                <TableHead>NIK</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Lokasi</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{user.nik}</TableCell>
                                <TableCell>{user.jabatan}</TableCell>
                                <TableCell>{user.lokasi}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                                        <Pencil className="h-4 w-4 text-amber-500"/>
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(user.id, user.username, 'user')} disabled={user.username.toUpperCase() === 'SUPERADMIN'}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                        <span className="sr-only">Hapus</span>
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </CardContent>
                    </Card>
                    </div>
                </div>
            </>
            )}
         </div>
      </SidebarInset>
    </SidebarProvider>

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini tidak dapat diurungkan. Anda akan menghapus {itemToDelete?.type} dengan nama <strong>{itemToDelete?.name}</strong>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Pengguna</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                    <Label htmlFor="editUsername">Nama Pengguna</Label>
                    <Input id="editUsername" name="editUsername" defaultValue={editingUser?.username} required style={{ textTransform: 'uppercase' }} />
                </div>
                <div>
                    <Label htmlFor="editPassword">Sandi Baru (opsional)</Label>
                    <Input id="editPassword" name="editPassword" type="password" placeholder="Kosongkan jika tidak ingin diubah" />
                </div>
                <div>
                    <Label htmlFor="editNik">NIK</Label>
                    <Input id="editNik" name="editNik" defaultValue={editingUser?.nik} required style={{ textTransform: 'uppercase' }} />
                </div>
                <div>
                    <Label htmlFor="editJabatan">Jabatan</Label>
                    <Select name="editJabatan" defaultValue={editingUser?.jabatan}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {jabatanOptions.map(jabatan => <SelectItem key={jabatan} value={jabatan}>{jabatan}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="editLokasi">Lokasi</Label>
                    <Select name="editLokasi" defaultValue={editingUser?.lokasi}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {locations.map(loc => <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Batal</Button>
                    <Button type="submit" disabled={isActionLoading}>
                         {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Simpan Perubahan'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </>
  );
}
