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

    useEffect(()=>{
        const fetchSession = async() =>{
           const {data:{session}} = await supabase.auth.getSession()
           setSession(session);
           if(session){
                const {data} = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setProfile(data || null);
           }
           setLoading(false);
        };
        fetchSession();
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
          });

    }, []);
    return (
        <AuthContext.Provider value={{session, loading, profile, isAdmin: profile?.group === 'ADMIN', user: profile?.username}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);