import request from 'supertest'
import { getFrenchLuxon } from '../../util'
import candidatModel from '../../models/candidat/candidat.model'
import { createCandidat } from '../../models/candidat'
import { BAD_PARAMS } from './message.constants'
import { createDepartement } from '../../models/departement'

const { connect, disconnect } = require('../../mongo-connection')
const {
  createCandidats,
  makeResas,
  createPlaces,
  deleteCandidats,
  removePlaces,
  candidats,
  createCentres,
  removeCentres,
} = require('../../models/__tests__')

const { default: app, apiPrefix } = require('../../app')

jest.mock('./middlewares/verify-user-level')
jest.mock('../middlewares/verify-token')
jest.mock('../business/send-mail')
jest.mock('../../util/logger')
require('../../util/logger').setWithConsole(false)

const bookedAt = getFrenchLuxon().toJSDate()

xdescribe('Test get and export candidats', () => {
  beforeAll(async () => {
    await connect()
    await createCandidats()
    await createCentres()
    await createPlaces()
    await makeResas(bookedAt)
  })

  afterAll(async () => {
    await removePlaces()
    await removeCentres()
    await deleteCandidats()
    await disconnect()
    await app.close()
  })

  it('Should response 200 with list candidats', async () => {
    const { body } = await request(app)
      .get(`${apiPrefix}/admin/candidats?departement=93`)
      .set('Accept', 'application/json')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200)

    expect(body.length).toBe(candidats.length)
  })
  it('Should response 200 with list candidats in a file', async () => {
    const { text } = await request(app)
      .get(`${apiPrefix}/admin/candidats?format=csv&departement=93`)
      .expect('Content-Type', 'text/csv; charset=utf-8')
      .expect(
        'Content-Disposition',
        'attachment; filename="candidatsLibresPrintel.csv"',
      )
      .expect(200)

    expect(text).not.toBe(expect.anything())
    expect(text.split('\n').length).toBe(candidats.length + 1)
  })
})

describe('Test update candidat e-mail and homeDepartement by admin', () => {
  const candidatToCreate = {
    codeNeph: '123456789000',
    nomNaissance: 'Nom à tester',
    prenom: 'Prénom à tester n°1',
    email: 'test1.test@test.com',
    portable: '0612345678',
    departement: '93',
    homeDepartement: '75',
  }

  let candidatCreated
  beforeAll(async () => {
    await connect()
    await createDepartement({ _id: '78', email: '78@dep.com', isAddedRecently: false })
    candidatCreated = await createCandidat(candidatToCreate)
  })
  afterAll(async () => {
    await candidatModel.deleteOne({ _id: candidatCreated._id })

    await disconnect()
  })

  const itHttpRequest = async (homeDepartement, email, status) => {
    const params = { email, homeDepartement }
    if (!homeDepartement) {
      delete params.homeDepartement
    }
    if (!email) {
      delete params.email
    }
    const { body } = await request(app)
      .patch(`${apiPrefix}/admin/candidats/${candidatCreated._id}`)
      .send({
        ...params,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(status)
    return body
  }
  const itWithBadParams = async (homeDepartement, email, message) => {
    const body = await itHttpRequest(homeDepartement, email, 400)
    expect(body).toHaveProperty('success', false)
    expect(body).toHaveProperty('message', message || BAD_PARAMS)
  }
  it('should 400 when email is undefined', async () => {
    await itWithBadParams()
  })

  it('should 400 when email do not  have the good format', async () => {
    await itWithBadParams(null, 'test.com')
  })

  it('should 400 when it is the same email ', async () => {
    await itWithBadParams(null, candidatToCreate.email, "Pas de modification pour le candidat 123456789000/NOM A TESTER. La nouvelle adresse courriel est identique à l'ancienne.")
  })

  it('should 200 when update candidat email', async () => {
    const body = await itHttpRequest(null, 'test.update@test.com', 200)
    expect(body).toHaveProperty('success', true)
    expect(body).toHaveProperty('message', 'Le courriel du candidat 123456789000/NOM A TESTER a été changé.')
  })

  it('should 400 when homeDepartement is undefined', async () => {
    await itWithBadParams()
  })

  it('should 400 when homeDepartement does not exist', async () => {
    await itWithBadParams('11', null)
  })

  it('should 200 when update candidat homeDepartement', async () => {
    const body = await itHttpRequest('78', null, 200)
    expect(body).toHaveProperty('success', true)
    console.log(body.message)
    expect(body).toHaveProperty('message', 'Le département de résidence du candidat 123456789000/NOM A TESTER a été changé.')
  })
})
