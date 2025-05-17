import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
export const useFetchSearches = () => {
    const { session } = useAuth();
  
    return useQuery({
      queryKey: ['searches'],
      queryFn: async () => {
        if (!session) return [];
  
        const { data, error } = await supabase
          .from('searches')
          .select('*')
          .eq('user_id', session?.user.id)
          .order('created_at', {ascending: false});
        if (error) {
          throw new Error(error.message);
        }
        return data;
      },
    });
  };
  export const useCreateSearch = () => {
    const { session } = useAuth();
    const query = useQueryClient();

    return useMutation({
        async mutationFn(input: any) { 
            if(!session) return;
            // Insert the new search
            const { data: newSearch, error } = await supabase
                .from('searches')
                .insert(
                    {
                        latitude: input.latitude,
                        longitude: input.longitude,
                        searchText: input.searchText,
                        user_id: session?.user.id,
                    }
                )
                .single();

            if (error) throw new Error(error.message);
           
            // Cleanup: Remove older entries if there are more than 5
            const { data: allSearches, error: fetchError } = await supabase
                .from('searches')
                .select('*')
                .eq('user_id', session?.user.id)
                .order('created_at', { ascending: true }); // Sort by oldest first

            if (fetchError) throw new Error(fetchError.message);

            if (allSearches.length > 5) {
                const excessSearches = allSearches.slice(0, allSearches.length - 5); // Get the oldest entries
                const idsToDelete = excessSearches.map((search) => search.id); // Extract their IDs

                const { error: deleteError } = await supabase
                    .from('searches')
                    .delete()
                    .in('id', idsToDelete); // Delete the excess entries

                if (deleteError) throw new Error(deleteError.message);
            }

            return newSearch;
        },
        async onSuccess() {
            await query.invalidateQueries({ queryKey: ['searches'] });
        },
    });
};
