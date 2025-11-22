import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.4/+esm'

// Obtener credenciales desde window (se asignan en index.html)
const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || ''
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.ANON_KEY || ''

// Crear cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase

/**
 * Registrar nuevo usuario y crear perfil
 * @param {string} email
 * @param {string} password
 * @param {object} userData - datos adicionales del usuario (fullName, phone, etc.)
 * @returns {Promise<{user, error}>}
 */
export async function registerUser(email, password, userData = {}) {
    try {
        // Registrar en Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData // Datos personalizados en metadata
            }
        })

        if (signUpError) {
            return { user: null, error: signUpError.message }
        }

        const newUser = data.user

        // Crear perfil del usuario en user_profiles
        if (newUser) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    id: newUser.id,
                    email: email,
                    full_name: userData.fullName || '',
                    phone: userData.phone || '',
                    is_verified: false
                })

            if (profileError) {
                console.warn('Advertencia: El perfil no se creó:', profileError.message)
                // No retornar error aquí, el registro fue exitoso
            }

            // Crear preferencias del usuario
            const { error: prefError } = await supabase
                .from('user_preferences')
                .insert({
                    user_id: newUser.id,
                    theme: 'light',
                    language: 'es',
                    currency: 'COP'
                })

            if (prefError) {
                console.warn('Advertencia: Las preferencias no se crearon:', prefError.message)
            }
        }

        return { user: newUser, error: null }
    } catch (err) {
        return { user: null, error: err.message }
    }
}

/**
 * Iniciar sesión
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{session, user, error}>}
 */
export async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            return { session: null, user: null, error: error.message }
        }

        return { session: data.session, user: data.user, error: null }
    } catch (err) {
        return { session: null, user: null, error: err.message }
    }
}

/**
 * Cerrar sesión
 * @returns {Promise<{error}>}
 */
export async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut()
        return { error: error ? error.message : null }
    } catch (err) {
        return { error: err.message }
    }
}

/**
 * Obtener sesión actual
 * @returns {Promise<{session, user, error}>}
 */
export async function getCurrentSession() {
    try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
            return { session: null, user: null, error: error.message }
        }

        return { session: data.session, user: data.session?.user || null, error: null }
    } catch (err) {
        return { session: null, user: null, error: err.message }
    }
}

/**
 * Cambiar contraseña
 * @param {string} newPassword
 * @returns {Promise<{error}>}
 */
export async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        return { error: error ? error.message : null }
    } catch (err) {
        return { error: err.message }
    }
}

/**
 * Validar email
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

/**
 * Validar contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
 * @param {string} password
 * @returns {boolean}
 */
export function validatePassword(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
}

/**
 * Obtener mensaje de error amigable
 * @param {string} errorCode
 * @returns {string}
 */
export function getErrorMessage(errorCode) {
    const messages = {
        'invalid_credentials': 'Email o contraseña incorrectos.',
        'user_already_exists': 'Este email ya está registrado.',
        'weak_password': 'La contraseña es muy débil.',
        'validation_failed': 'Validación fallida. Verifica los datos.',
        'network_error': 'Error de conexión. Intenta de nuevo.',
        'unauthorized': 'No autorizado.',
        'not_authenticated': 'Debes iniciar sesión.',
    }
    return messages[errorCode] || 'Ocurrió un error. Intenta de nuevo.'
}

/**
 * Obtener perfil del usuario
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{profile, error}>}
 */
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            return { profile: null, error: error.message }
        }

        return { profile: data, error: null }
    } catch (err) {
        return { profile: null, error: err.message }
    }
}

/**
 * Actualizar perfil del usuario
 * @param {string} userId - UUID del usuario
 * @param {object} updates - datos a actualizar
 * @returns {Promise<{profile, error}>}
 */
export async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            return { profile: null, error: error.message }
        }

        return { profile: data, error: null }
    } catch (err) {
        return { profile: null, error: err.message }
    }
}

/**
 * Obtener preferencias del usuario
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{preferences, error}>}
 */
export async function getUserPreferences(userId) {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) {
            return { preferences: null, error: error.message }
        }

        return { preferences: data, error: null }
    } catch (err) {
        return { preferences: null, error: err.message }
    }
}

/**
 * Actualizar preferencias del usuario
 * @param {string} userId - UUID del usuario
 * @param {object} updates - preferencias a actualizar
 * @returns {Promise<{preferences, error}>}
 */
export async function updateUserPreferences(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            return { preferences: null, error: error.message }
        }

        return { preferences: data, error: null }
    } catch (err) {
        return { preferences: null, error: err.message }
    }
}

/**
 * Agregar dirección de envío
 * @param {string} userId - UUID del usuario
 * @param {object} addressData - datos de la dirección
 * @returns {Promise<{address, error}>}
 */
export async function addUserAddress(userId, addressData) {
    try {
        const { data, error } = await supabase
            .from('user_addresses')
            .insert({
                user_id: userId,
                ...addressData
            })
            .select()
            .single()

        if (error) {
            return { address: null, error: error.message }
        }

        return { address: data, error: null }
    } catch (err) {
        return { address: null, error: err.message }
    }
}

/**
 * Obtener todas las direcciones del usuario
 * @param {string} userId - UUID del usuario
 * @returns {Promise<{addresses, error}>}
 */
export async function getUserAddresses(userId) {
    try {
        const { data, error } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false })

        if (error) {
            return { addresses: null, error: error.message }
        }

        return { addresses: data || [], error: null }
    } catch (err) {
        return { addresses: null, error: err.message }
    }
}

/**
 * Eliminar dirección de envío
 * @param {number} addressId - ID de la dirección
 * @returns {Promise<{error}>}
 */
export async function deleteUserAddress(addressId) {
    try {
        const { error } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', addressId)

        return { error: error ? error.message : null }
    } catch (err) {
        return { error: err.message }
    }
}
