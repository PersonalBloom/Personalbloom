import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d18',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarActiveTintColor:   '#A78BFA',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home'     }} />
      <Tabs.Screen name="planner"  options={{ title: 'Planner'  }} />
      <Tabs.Screen name="quiz"     options={{ title: 'Quiz'     }} />
      <Tabs.Screen name="focus"    options={{ title: 'Focus'    }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  )
}
