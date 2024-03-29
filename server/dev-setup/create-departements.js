import { createDepartement } from '../src/models/departement'
import { simpleLogger as logger } from '../src/util'

import departements from './departements'

logger.info('creating departements')

export default async () => {
  const departementsCreated = departements.map(({ _id, email, disableAt }) =>
    createDepartement({ _id, email, disableAt })
      .then(() => {
        logger.info(`Departement ${_id} créé !`)
      })
      .catch(error => logger.error(error)),
  )
  return Promise.all(departementsCreated)
}
