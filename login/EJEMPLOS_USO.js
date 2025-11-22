// ===== EJEMPLOS DE USO - Funciones de Perfil de Usuario =====

// Nota: Asegúrate de estar autenticado (haber iniciado sesión)

import {
    loginUser,
    getCurrentSession,
    getUserProfile,
    updateUserProfile,
    getUserPreferences,
    updateUserPreferences,
    getUserAddresses,
    addUserAddress,
    deleteUserAddress
} from './auth.js'

// ===== EJEMPLO 1: Obtener sesión actual y perfil del usuario =====
async function loadUserProfile() {
    // Obtener sesión actual
    const { session, user, error: sessionError } = await getCurrentSession()

    if (!user) {
        console.log('No hay usuario autenticado')
        return
    }

    console.log('Usuario autenticado:', user.email)

    // Obtener perfil completo
    const { profile, error: profileError } = await getUserProfile(user.id)

    if (profileError) {
        console.error('Error al cargar perfil:', profileError)
        return
    }

    console.log('Perfil del usuario:', profile)
    console.log(`Nombre: ${profile.full_name}`)
    console.log(`Email: ${profile.email}`)
    console.log(`Teléfono: ${profile.phone}`)
    console.log(`Avatar: ${profile.avatar_url}`)
}

// ===== EJEMPLO 2: Actualizar perfil del usuario =====
async function updateProfile() {
    const { session, user } = await getCurrentSession()

    if (!user) return

    const { profile, error } = await updateUserProfile(user.id, {
        full_name: 'Juan Pérez García',
        phone: '+34 123 456 789',
        city: 'Madrid',
        country: 'España',
        bio: 'Amante de la tecnología'
    })

    if (error) {
        console.error('Error al actualizar:', error)
    } else {
        console.log('✓ Perfil actualizado:', profile)
    }
}

// ===== EJEMPLO 3: Obtener y actualizar preferencias =====
async function updateUserPrefs() {
    const { session, user } = await getCurrentSession()

    if (!user) return

    // Obtener preferencias actuales
    const { preferences } = await getUserPreferences(user.id)
    console.log('Preferencias actuales:', preferences)

    // Actualizar preferencias
    const { preferences: updated, error } = await updateUserPreferences(user.id, {
        theme: 'dark',
        language: 'en',
        notifications_email: true,
        newsletter_subscribed: false
    })

    if (!error) {
        console.log('✓ Preferencias actualizadas:', updated)
    }
}

// ===== EJEMPLO 4: Agregar una dirección de envío =====
async function addNewAddress() {
    const { session, user } = await getCurrentSession()

    if (!user) return

    const { address, error } = await addUserAddress(user.id, {
        label: 'Casa',
        street_address: 'Calle Principal 123',
        apartment_number: 'Apto 4B',
        city: 'Madrid',
        state: 'Madrid',
        postal_code: '28001',
        country: 'España',
        phone: '+34 123 456 789',
        is_default: true
    })

    if (error) {
        console.error('Error al agregar dirección:', error)
    } else {
        console.log('✓ Dirección agregada:', address)
    }
}

// ===== EJEMPLO 5: Obtener todas las direcciones =====
async function loadUserAddresses() {
    const { session, user } = await getCurrentSession()

    if (!user) return

    const { addresses, error } = await getUserAddresses(user.id)

    if (error) {
        console.error('Error al cargar direcciones:', error)
        return
    }

    console.log('Direcciones del usuario:', addresses)

    addresses.forEach((addr, index) => {
        console.log(`\nDirección ${index + 1}:`)
        console.log(`  Etiqueta: ${addr.label}`)
        console.log(`  ${addr.street_address}`)
        console.log(`  ${addr.city}, ${addr.postal_code}`)
        console.log(`  ${addr.country}`)
        console.log(`  Por defecto: ${addr.is_default ? 'Sí' : 'No'}`)
    })
}

// ===== EJEMPLO 6: Flujo completo de registro y configuración =====
async function completeRegistrationFlow() {
    // Paso 1: Registrar usuario
    const { user: newUser, error: regError } = await registerUser(
        'nuevo@example.com',
        'Password123',
        {
            fullName: 'María García López',
            phone: '+34 987 654 321'
        }
    )

    if (regError) {
        console.error('Error en registro:', regError)
        return
    }

    console.log('✓ Usuario registrado:', newUser.email)

    // Paso 2: Iniciar sesión automático
    const { session, user, error: loginError } = await loginUser(
        'nuevo@example.com',
        'Password123'
    )

    if (loginError) {
        console.error('Error en login:', loginError)
        return
    }

    console.log('✓ Sesión iniciada')

    // Paso 3: Actualizar perfil completo
    await updateUserProfile(user.id, {
        bio: 'Mi primera compra en NexusShop',
        avatar_url: 'https://example.com/avatar.jpg'
    })

    // Paso 4: Agregar dirección de envío
    await addUserAddress(user.id, {
        label: 'Casa',
        street_address: 'Dirección ejemplo 456',
        city: 'Barcelona',
        state: 'Barcelona',
        postal_code: '08002',
        country: 'España',
        phone: '+34 987 654 321',
        is_default: true
    })

    // Paso 5: Configurar preferencias
    await updateUserPreferences(user.id, {
        theme: 'dark',
        language: 'es',
        currency: 'EUR',
        newsletter_subscribed: true
    })

    console.log('✓ Perfil completamente configurado')
}

// ===== EJEMPLO 7: Componente React para mostrar perfil =====
/*
import React, { useEffect, useState } from 'react'
import { getCurrentSession, getUserProfile } from './auth'

function UserProfileComponent() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { user } = await getCurrentSession()
      if (!user) {
        setError('No autenticado')
        return
      }

      const { profile, error } = await getUserProfile(user.id)
      if (error) throw new Error(error)

      setProfile(profile)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>
  if (!profile) return <div>No hay perfil</div>

  return (
    <div className="profile-card">
      <h2>{profile.full_name}</h2>
      <p>{profile.email}</p>
      <p>{profile.phone}</p>
      {profile.avatar_url && (
        <img src={profile.avatar_url} alt="Avatar" />
      )}
      <p>{profile.bio}</p>
    </div>
  )
}

export default UserProfileComponent
*/

// ===== EJEMPLO 8: Guardar dirección desde un formulario =====
async function handleAddressSubmit(formData) {
    const { user } = await getCurrentSession()
    if (!user) {
        alert('Debes iniciar sesión primero')
        return
    }

    const { address, error } = await addUserAddress(user.id, {
        label: formData.label || 'Casa',
        street_address: formData.street,
        apartment_number: formData.apartment,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
        is_default: formData.isDefault || false
    })

    if (error) {
        console.error('❌ Error:', error)
        alert('Error al guardar dirección: ' + error)
    } else {
        console.log('✓ Dirección guardada')
        alert('¡Dirección guardada correctamente!')
    }
}

// ===== EJECUTAR EJEMPLOS =====

// Descomentar la función que quieras ejecutar:

// await loadUserProfile()
// await updateProfile()
// await updateUserPrefs()
// await addNewAddress()
// await loadUserAddresses()
// await completeRegistrationFlow()
