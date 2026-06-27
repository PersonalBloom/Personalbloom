import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import { supabase } from '../../src/lib/supabase'

export default function HomeScreen() {
  const [profile, setProfile] = useState<{ name: string; streak: number; growth_points: number } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('name, streak, growth_points')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data as { name: string; streak: number; growth_points: number })
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d0d18' }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View>
          <Text style={{ color: '#A78BFA', fontSize: 28, fontWeight: '900' }}>
            {greeting}, {profile?.name || 'Bloomer'} 🌸
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>
            Ready to bloom today? Let's keep that streak going! 🌸
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { icon: '🔥', label: 'Streak', value: String(profile?.streak || 0) + 'd' },
            { icon: '⚡', label: 'XP',     value: String(profile?.growth_points || 0) },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 28 }}>{s.icon}</Text>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{s.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{s.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            { icon: '🧠', label: 'Quiz'    },
            { icon: '📅', label: 'Planner' },
            { icon: '🎧', label: 'Focus'   },
            { icon: '📊', label: 'Progress'},
          ].map(a => (
            <TouchableOpacity key={a.label} style={{ width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 32 }}>{a.icon}</Text>
              <Text style={{ color: '#fff', fontWeight: '600', marginTop: 8 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
