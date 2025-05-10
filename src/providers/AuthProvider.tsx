import React from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Tables } from "types/database.types";

type AuthData={
    session: Session | null
    loading: boolean
    profile: any,
    isAdmin: boolean,
    user: string | null | undefined,
};

const AuthContext = createContext<AuthData>({
    session:null,
    loading:true,
    profile: null,
    isAdmin: false,
    user: '',
});
type ProfileDB = {
    profile: Tables<'profiles'>;
} | null;
type Profile = {
    group: string | null,
    username: string | null,
}
export default function AuthProvider({children}: PropsWithChildren)
{
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const loadUserProfile =  async (userId : string) => {
        const {data} = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        setProfile(data || null);
    }
    useEffect(()=>{
        const fetchSession = async() =>{
           const {data:{session}} = await supabase.auth.getSession()
           setSession(session);
           if(session){
                loadUserProfile(session.user.id)
           }
           setLoading(false);
        };
        fetchSession();
        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session?.user.id) {
            await loadUserProfile(session.user.id);
        } else {
            setProfile(null); 
        }
        });

        return () => {
            subscription.subscription.unsubscribe();
        }

    }, []);
    return (
        <AuthContext.Provider value={{session, loading, profile, isAdmin: profile?.group === 'ADMIN', user: profile?.username}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);