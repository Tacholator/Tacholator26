import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Loader2, UserCog, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AdminRoleManagement() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => base44.entities.User.update(userId, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      toast({
        title: 'Role Updated',
        description: 'User role has been successfully changed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive'
      });
    }
  });

  const handleRoleChange = (userId, newRole) => {
    if (userId === currentUser?.id) {
      toast({
        title: 'Cannot Change Own Role',
        description: 'You cannot change your own role.',
        variant: 'destructive'
      });
      return;
    }

    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId, newRole });
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower)
    );
  });

  if (!currentUser || currentUser.email !== 'fasobah@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-rose-500" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Denied</h2>
          <p className="text-slate-500">
            You don't have permission to access this page.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-purple-600" />
            Role Management
          </h1>
          <p className="text-slate-500 mt-1">Manage user roles and permissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-slate-800">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Admins (Instructors)</p>
              <p className="text-2xl font-bold text-slate-800">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Users (Pupils)</p>
              <p className="text-2xl font-bold text-slate-800">
                {users.filter(u => u.role === 'user').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* User Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Current Role</TableHead>
                  <TableHead className="font-semibold">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const displayName = user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.full_name || 'Unknown';

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {displayName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{displayName}</p>
                            {user.id === currentUser?.id && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }>
                          {user.role === 'admin' ? 'Instructor (Admin)' : 'Pupil (User)'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                          disabled={user.id === currentUser?.id || updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Instructor (Admin)</SelectItem>
                            <SelectItem value="user">Pupil (User)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}