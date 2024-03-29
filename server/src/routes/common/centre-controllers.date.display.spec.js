import request from 'supertest'

import { connect, disconnect } from '../../mongo-connection'

import app, { apiPrefix } from '../../app'

import {
  createCandidats,
  setInitCreatedCentre,
  resetCreatedInspecteurs,
} from '../../models/__tests__'
import {
  centreDateDisplay,
  createPlacesWithVisibleAt,
} from '../../models/__tests__/places.date.display'

import {
  setNowBefore12h,
  setNowAfter12h,
  setNowAtNow,
} from '../candidat/__tests__/luxon-time-setting'
import { placesAndGeoDepartementsAndCentresCache } from '../middlewares'

jest.mock('../../util/logger')
require('../../util/logger').setWithConsole(false)
jest.mock('../middlewares/verify-token')
jest.mock('../middlewares/verify-user')
jest.mock('../common/candidat-status-const', () => ({
  candidatStatuses: { nbStatus: undefined, msec: undefined },
}))

describe('Get centres with the numbers places available in departements and display at 12h', () => {
  beforeAll(async () => {
    await connect()
    const createdCandidats = await createCandidats()
    require('../middlewares/verify-token').__setIdCandidat(
      createdCandidats[0]._id,
    )

    setInitCreatedCentre()
    resetCreatedInspecteurs()

    await createPlacesWithVisibleAt()

    await placesAndGeoDepartementsAndCentresCache.setGeoDepartemensAndCentres()
    await placesAndGeoDepartementsAndCentresCache.setPlaces()
  })

  afterAll(async () => {
    await disconnect()
    setNowAtNow()
  })

  it('Should response 200 and empty result to find centres which a departement do not existe', async () => {
    const { body } = await request(app)
      .get(`${apiPrefix}/candidat/centres?departement=AA`)
      .set('Accept', 'application/json')
      .expect(200)

    expect(body).toBeDefined()
    expect(body).toEqual([])
  })

  it('Should response 200 to find 2 centres with one place from departement 75 when is before 12h', async () => {
    setNowBefore12h()

    const departement = centreDateDisplay.geoDepartement
    const { body } = await request(app)
      .get(`${apiPrefix}/candidat/centres?departement=${departement}`)
      .set('Accept', 'application/json')
      .expect(200)

    expect(body).toBeDefined()
    expect(body).toHaveLength(2)
    const centre = body.find(
      ({ centre: { _id } }) =>
        _id.toString() === centreDateDisplay._id.toString(),
    )
    expect(centre).toHaveProperty('count', 1)
  })

  it('Should response 200 to find 2 centres whit 3 places from departement 75 when is after 12h', async () => {
    setNowAfter12h()

    const departement = centreDateDisplay.geoDepartement
    const { body } = await request(app)
      .get(`${apiPrefix}/candidat/centres?departement=${departement}`)
      .set('Accept', 'application/json')
      .expect(200)

    expect(body).toBeDefined()
    expect(body).toHaveLength(2)
    const centre = body.find(
      ({ centre: { _id } }) =>
        _id.toString() === centreDateDisplay._id.toString(),
    )
    expect(centre).toHaveProperty('count', 1)
  })
})
