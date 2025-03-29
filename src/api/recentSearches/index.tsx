import {useMutation} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
export const useCreateSearch = () => {
    const {session} = useAuth();
    return useMutation({
        async mutationFn(data: any){
            const { data:newSearch, error } = await supabase
            .from('searches')
            .insert({
                latitude: data.latitude,
                longitude: data.longitude,
                user_id: session?.user.id,
                searchText: data.searchText,
            })
            .single()

            if(error) throw new Error(error.message);
            return newSearch;
        },
    })
};