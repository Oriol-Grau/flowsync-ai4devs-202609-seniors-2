import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable identificable, que la tarea no
 * filtra datos de cuenta (suelta y dentro de la lista) y el responsable sin
 * nombre.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const HOY = '2026-10-06'

  async function sesion(client: any, email = 'mira@example.com') {
    await User.create({ fullName: 'Quien Mira', email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(fullName: string | null, email: string) {
    const responsable = await User.create({ fullName, email, password: 'secreto123' })

    return Task.create({ title: 'Preparar la demo', status: 'pending', assigneeId: responsable.id })
  }

  test('el assignee trae el nombre y las iniciales del responsable', async ({ client, assert }) => {
    const token = await sesion(client)
    const tarea = await tareaDe('Ada Lovelace', 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const { assignee } = response.body().data
    assert.equal(assignee.fullName, 'Ada Lovelace')
    assert.equal(assignee.initials, 'AL')
  })

  test('la tarea suelta no incluye el email ni otros datos de acceso del responsable', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe('Ada Lovelace', 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const { assignee } = response.body().data
    assert.notProperty(assignee, 'email')
    assert.notProperty(assignee, 'password')
    assert.notInclude(JSON.stringify(assignee), 'ada@example.com')
  })

  test('la lista no incluye el email ni otros datos de acceso del responsable', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    await tareaDe('Ada Lovelace', 'ada@example.com')

    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const [tarea] = response.body().data as any[]
    assert.notProperty(tarea.assignee, 'email')
    assert.notProperty(tarea.assignee, 'password')
    assert.notInclude(JSON.stringify(tarea.assignee), 'ada@example.com')
  })

  test('un responsable sin nombre llega con el nombre nulo y sus iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const tarea = await tareaDe(null, 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const { assignee } = response.body().data
    assert.isNull(assignee.fullName)
    assert.equal(assignee.initials, 'AE')
  })

  test('un responsable sin nombre también llega sin nombre en la lista, con sus iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    await tareaDe(null, 'ada@example.com')

    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const [tarea] = response.body().data as any[]
    assert.isNull(tarea.assignee.fullName)
    assert.equal(tarea.assignee.initials, 'AE')
  })
})
