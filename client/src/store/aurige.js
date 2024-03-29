
import { chunk } from 'lodash'

import api from '@/api'
import { SHOW_ERROR, SHOW_SUCCESS } from '@/store'
import {
  getFrenchDateTimeFromIso,
  uploadFileBatchAurige,
  getJsonFromFile,
} from '@/util'

export const SHOW_AURIGE_RESULT = 'SHOW_AURIGE_RESULT'
export const AURIGE_UPLOAD_CANDIDATS_REQUEST = 'AURIGE_UPLOAD_CANDIDATS_REQUEST'
export const AURIGE_UPLOAD_CANDIDATS_SUCCESS = 'AURIGE_UPLOAD_CANDIDATS_SUCCESS'
export const AURIGE_UPLOAD_CANDIDATS_FAILURE = 'AURIGE_UPLOAD_CANDIDATS_FAILURE'

export const FETCH_CANDILIB_STATUS_REQUEST = 'FETCH_CANDILIB_STATUS_REQUEST'
export const FETCH_CANDILIB_STATUS_SUCCESS = 'FETCH_CANDILIB_STATUS_SUCCESS'
export const FETCH_CANDILIB_STATUS_FAILURE = 'FETCH_CANDILIB_STATUS_FAILURE'

export const FETCH_AURIGE_LAST_DATETIME_REQUEST = 'FETCH_AURIGE_LAST_DATETIME_REQUEST'
export const FETCH_AURIGE_LAST_DATETIME_SUCCESS = 'FETCH_AURIGE_LAST_DATETIME_SUCCESS'
export const FETCH_AURIGE_LAST_DATETIME_FAILURE = 'FETCH_AURIGE_LAST_DATETIME_FAILURE'

export const FETCH_AURIGE_NBDAYS_INACTIVE_REQUEST = 'FETCH_AURIGE_NBDAYS_INACTIVE_REQUEST'
export const FETCH_AURIGE_NBDAYS_INACTIVE_SUCCESS = 'FETCH_AURIGE_NBDAYS_INACTIVE_SUCCESS'
export const FETCH_AURIGE_NBDAYS_INACTIVE_FAILURE = 'FETCH_AURIGE_NBDAYS_INACTIVE_FAILURE'

export default {
  state: {
    isLoading: false,
    candidats: [],
    feedBack: [],
    lastSyncDateTime: 'La date du dernier batch Aurige n\'est pas encore renseigné',
    isLastSyncDateTimeLoading: false,
    isFetchingStatusCandilib: false,
    statusCandilibSuccess: undefined,
    nbDaysInactive: undefined,
    isFectingNbDaysInactive: false,
  },
  mutations: {
    [AURIGE_UPLOAD_CANDIDATS_REQUEST] (state) {
      state.isLoading = true
    },
    [AURIGE_UPLOAD_CANDIDATS_SUCCESS] (state, candidats) {
      state.isLoading = false
      state.candidats = candidats
    },
    [AURIGE_UPLOAD_CANDIDATS_FAILURE] (state) {
      state.isLoading = false
    },

    [FETCH_AURIGE_LAST_DATETIME_REQUEST] (state) {
      state.isLastSyncDateTimeLoading = true
    },
    [FETCH_AURIGE_LAST_DATETIME_SUCCESS] (state, lastDateTimeAurige) {
      state.isLastSyncDateTimeLoading = false
      state.lastSyncDateTime = lastDateTimeAurige
    },
    [FETCH_AURIGE_LAST_DATETIME_FAILURE] (state) {
      state.isLastSyncDateTimeLoading = false
    },

    [FETCH_CANDILIB_STATUS_REQUEST] (state) {
      state.isFetchingStatusCandilib = true
    },
    [FETCH_CANDILIB_STATUS_SUCCESS] (state, statusCandilibSuccess) {
      state.isFetchingStatusCandilib = false
      state.statusCandilibSuccess = statusCandilibSuccess
    },
    [FETCH_CANDILIB_STATUS_FAILURE] (state) {
      state.isFetchingStatusCandilib = false
    },

    [FETCH_AURIGE_NBDAYS_INACTIVE_REQUEST] (state) {
      state.isFectingNbDaysInactive = true
    },
    [FETCH_AURIGE_NBDAYS_INACTIVE_SUCCESS] (state, nbDaysInactive) {
      state.isFectingNbDaysInactive = false
      state.nbDaysInactive = nbDaysInactive
    },
    [FETCH_AURIGE_NBDAYS_INACTIVE_FAILURE] (state) {
      state.isFectingNbDaysInactive = false
    },

  },
  actions: {
    async [AURIGE_UPLOAD_CANDIDATS_REQUEST] ({ commit, dispatch, state }, file) {
      commit(AURIGE_UPLOAD_CANDIDATS_REQUEST)
      try {
        const candidats = await getJsonFromFile(file)
        const divideArrayBy = 1000

        const files = chunk(candidats, divideArrayBy)
          .map((chunk, index) => {
            const builtFile = new File(
              [JSON.stringify(chunk)],
              `batchFileChunk_${index}`,
              { type: 'application/json' })
            return builtFile
          })

        const uploadResults = await files.reduce(async (acc, currentFile) => {
          return acc.then(async results => {
            try {
              const candidatsFeedBack = await uploadFileBatchAurige(api, currentFile)
              results.success = [
                ...results.success,
                ...candidatsFeedBack,
              ]
            } catch (error) {
              results.errors = [
                ...results.errors,
                error.message,
              ]
            }
            return results
          })
        }, Promise.resolve({ success: [], errors: [] }))

        commit(AURIGE_UPLOAD_CANDIDATS_SUCCESS, uploadResults.success)

        if (uploadResults && uploadResults.errors.length) {
          throw new Error('Une ou plusieurs erreurs on été détecté pendant le traitement du fichier .json merci de vérifier son contenu ou de relancer le batch.')
        }

        if (uploadResults.success.length) {
          return dispatch(SHOW_SUCCESS, `Le fichier ${file.name} a été synchronisé.`)
        }
        throw new Error('La synchro aurige c\'est bien déroulé cependant il semblerais que aucun candidats n\'est été mis à jours.')
      } catch (error) {
        commit(AURIGE_UPLOAD_CANDIDATS_FAILURE)
        return dispatch(SHOW_ERROR, error.message)
      }
    },

    async [FETCH_AURIGE_LAST_DATETIME_REQUEST] ({ commit, dispatch }) {
      commit(FETCH_AURIGE_LAST_DATETIME_REQUEST)
      try {
        const result = await api.admin.getLastSyncAurigeDateTime()
        if (result.success === false) {
          throw new Error(result.message)
        }

        commit(FETCH_AURIGE_LAST_DATETIME_SUCCESS, getFrenchDateTimeFromIso(result.aurigeInfo.date))
      } catch (error) {
        commit(FETCH_AURIGE_LAST_DATETIME_FAILURE)
      }
    },

    async [FETCH_CANDILIB_STATUS_REQUEST] ({ commit, dispatch }, nbDays) {
      commit(FETCH_CANDILIB_STATUS_REQUEST)
      try {
        const result = await api.admin.sortStatusCandilib(nbDays)
        if (result.success === false) {
          throw new Error(result.message)
        }

        commit(FETCH_CANDILIB_STATUS_SUCCESS, result)
        return dispatch(SHOW_SUCCESS, result.message)
      } catch (error) {
        commit(FETCH_CANDILIB_STATUS_FAILURE, error)
        return dispatch(SHOW_ERROR, error.message)
      }
    },

    async [FETCH_AURIGE_NBDAYS_INACTIVE_REQUEST] ({ commit, dispatch }) {
      commit(FETCH_AURIGE_NBDAYS_INACTIVE_REQUEST)
      try {
        const result = await api.admin.getNbDaysInactivity()
        if (result.success === false) {
          throw new Error(result.message)
        }

        commit(FETCH_AURIGE_NBDAYS_INACTIVE_SUCCESS, result.NbDaysInactivity)
      } catch (error) {
        commit(FETCH_AURIGE_NBDAYS_INACTIVE_FAILURE, error)
        return dispatch(SHOW_ERROR, error.message)
      }
    },
  },
}
