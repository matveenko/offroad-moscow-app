import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Function init started")

Deno.serve(async (req) => {
  try {
    console.log("1. Request received")

    // Проверка метода
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // 1. Парсим данные
    const formData = await req.formData()
    const notification_type = formData.get('notification_type')
    const operation_id = formData.get('operation_id')
    const amount = formData.get('amount')
    const currency = formData.get('currency')
    const datetime = formData.get('datetime')
    const sender = formData.get('sender')
    const codepro = formData.get('codepro')
    const label = formData.get('label') 
    const sha1_hash = formData.get('sha1_hash') 
    const unaccepted = formData.get('unaccepted')

    console.log(`2. Parsed data. Label: ${label}, Amount: ${amount}`)

    // 2. Проверка секрета
    const secret = Deno.env.get('YOOMONEY_SECRET')
    if (!secret) {
      console.error("CRITICAL: YOOMONEY_SECRET is missing in env!")
      return new Response('Server Config Error: Missing Secret', { status: 500 })
    }
    console.log("3. Secret found (length: " + secret.length + ")")

    // 3. Считаем хеш (Встроенный Crypto)
    const stringToHash = `${notification_type}&${operation_id}&${amount}&${currency}&${datetime}&${sender}&${codepro}&${secret}&${label}`
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log(`4. Hash calc. Ours: ${calculatedHash}, Theirs: ${sha1_hash}`)

    if (calculatedHash !== sha1_hash) {
      console.error('Hash mismatch! Fake request.')
      return new Response('Invalid Hash', { status: 403 })
    }

    // 4. Инициализация Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL: Supabase URL or Key missing!")
        return new Response('DB Config Error', { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    console.log("5. DB Client created")

    // 5. Обновляем базу
    if (label) {
        const regId = label.toString().replace('reg_', '')
        console.log(`6. Updating registration ID: ${regId}`)

        const { error } = await supabaseAdmin
            .from('registrations')
            .update({ 
                payment_status: 'paid'
            })
            .eq('id', regId)

        if (error) {
            console.error('DB Update Error:', error)
            return new Response('DB Update Failed: ' + error.message, { status: 500 })
        }
        console.log("7. SUCCESS! DB Updated.")
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error("FATAL ERROR:", error)
    return new Response('Internal Error: ' + error.message, { status: 500 })
  }
})