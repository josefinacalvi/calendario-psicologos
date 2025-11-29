'use server'
import { supabase } from '../../lib/supabaseClient'
import { revalidatePath } from 'next/cache'

export async function createPerfil(formData: FormData) {
  // Datos de contacto (NUEVOS)
  const nombre_completo = formData.get('nombre_completo') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string | null
  const fecha_nacimiento = formData.get('fecha_nacimiento') as string | null
  
  // Datos profesionales
  const orientacion_clinica = formData.get('orientacion_clinica') as string
  const especialidades_str = formData.get('especialidades') as string
  const modalidad = formData.get('modalidad') as string
  const zona = formData.get('zona') as string | null
  const disponibilidad_general = formData.get('disponibilidad_general') as string
  const frase_clave = formData.get('frase_clave') as string
  const mini_bio = formData.get('mini_bio') as string

  const especialidades_array = especialidades_str
    ? especialidades_str.split(',').map(s => s.trim())
    : []

  const { data, error } = await supabase
    .from('perfiles_psicologos')
    .insert({
      nombre_completo,
      email,
      phone: phone || null,
      fecha_nacimiento: fecha_nacimiento || null,
      orientacion_clinica,
      especialidades: especialidades_array,
      modalidad,
      zona: modalidad === 'virtual' ? null : zona,
      disponibilidad_general,
      frase_clave,
      mini_bio,
      estado: 'ENTREVISTADO',  // Estado inicial post-entrevista
      fecha_entrevista_aprobada: new Date().toISOString(),  // Para calcular días en Workflow 1
    })
    .select()

  if (error) {
    console.error('Error al insertar perfil:', error)
    return { success: false, message: 'Fallo la carga del perfil: ' + error.message }
  }

  revalidatePath('/')
  return { success: true, message: `Perfil de ${nombre_completo} creado exitosamente. Recibirá el email de invitación.` }
}
