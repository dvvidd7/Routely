import {useMutation} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
export const useUpdateUser = () => {
    const {session} = useAuth();
    return useMutation({
        async mutationFn(data: any){
            const { data:updatedUser, error } = await supabase
            .from('profiles')
            .update({ username: data.user})
            .eq('id', session?.user.id)
            .select().single();

            if(error) throw new Error(error.message);
            return updatedUser;
        },
    })
};
export const useUpdateTransport = () => {
    const {session} = useAuth();
    return useMutation({
        async mutationFn(data: any){
            const { data:favTrans, error } = await supabase
            .from('profiles')
            .update({ fav_transport: data.fav_transport})
            .eq('id', session?.user.id)
            .select().single();

            if(error) throw new Error(error.message);
            return favTrans;
            
        },
    })
};