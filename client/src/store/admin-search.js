import api from '@/api'
import { SHOW_ERROR, SHOW_SUCCESS } from './message'

export const FETCH_AUTOCOMPLETE_CANDIDATS_REQUEST = 'FETCH_AUTOCOMPLETE_CANDIDATS_REQUEST'
export const FETCH_AUTOCOMPLETE_CANDIDATS_SUCCESS = 'FETCH_AUTOCOMPLETE_CANDIDATS_SUCCESS'
export const FETCH_AUTOCOMPLETE_CANDIDATS_FAILURE = 'FETCH_AUTOCOMPLETE_CANDIDATS_FAILURE'

export const FETCH_AUTOCOMPLETE_INSPECTEURS_REQUEST = 'FETCH_AUTOCOMPLETE_INSPECTEURS_REQUEST'
export const FETCH_AUTOCOMPLETE_INSPECTEURS_SUCCESS = 'FETCH_AUTOCOMPLETE_INSPECTEURS_SUCCESS'
export const FETCH_AUTOCOMPLETE_INSPECTEURS_FAILURE = 'FETCH_AUTOCOMPLETE_INSPECTEURS_FAILURE'

export const FETCH_CANDIDAT_INFO_REQUEST = 'FETCH_CANDIDAT_INFO_REQUEST'
export const FETCH_CANDIDAT_INFO_SUCCESS = 'FETCH_CANDIDAT_INFO_SUCCESS'
export const FETCH_CANDIDAT_INFO_FAILURE = 'FETCH_CANDIDAT_INFO_FAILURE'

export const FETCH_UPDATE_CANDIDAT_EMAIL_REQUEST = 'FETCH_UPDATE_CANDIDAT_EMAIL_REQUEST'
export const FETCH_UPDATE_CANDIDAT_EMAIL_SUCCESS = 'FETCH_UPDATE_CANDIDAT_EMAIL_SUCCESS'
export const FETCH_UPDATE_CANDIDAT_EMAIL_FAILURE = 'FETCH_UPDATE_CANDIDAT_EMAIL_REQUEST'

export const FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_REQUEST = 'FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_REQUEST'
export const FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_SUCCESS = 'FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_SUCCESS'
export const FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_FAILURE = 'FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_FAILURE'

export const FETCH_REMOVE_CANDIDAT_CANBOOK_REQUEST = 'FETCH_REMOVE_CANDIDAT_CANBOOK_REQUEST'
export const FETCH_REMOVE_CANDIDAT_CANBOOK_SUCCESS = 'FETCH_REMOVE_CANDIDAT_CANBOOK_SUCCESS'
export const FETCH_REMOVE_CANDIDAT_CANBOOK_FAILURE = 'FETCH_REMOVE_CANDIDAT_CANBOOK_REQUEST'

export const FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_REQUEST = 'FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_REQUEST'
export const FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_SUCCESS = 'FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_SUCCESS'
export const FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_FAILURE = 'FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_FAILURE'

export const FETCH_CANDIDATS_BY_IPCSR_DATE_REQUEST = 'FETCH_CANDIDATS_BY_IPCSR_DATE_REQUEST'
export const FETCH_CANDIDATS_BY_IPCSR_DATE_SUCCESS = 'FETCH_CANDIDATS_BY_IPCSR_DATE_SUCCESS'
export const FETCH_CANDIDATS_BY_IPCSR_DATE_FAILURE = 'FETCH_CANDIDATS_BY_IPCSR_DATE_FAILURE'

export default {
  state: {
    candidats: {
      selected: undefined,
      isFetching: false,
      list: [],
      error: undefined,
    },

    inspecteurs: {
      isFetching: false,
      list: [],
      error: undefined,
    },

    candidatsByIpcsrDate: {
      isFetching: false,
      list: [],
      error: undefined,
    },
  },

  mutations: {
    FETCH_AUTOCOMPLETE_CANDIDATS_REQUEST (state) {
      state.candidats.isFetching = true
      state.candidats.error = undefined
    },
    FETCH_AUTOCOMPLETE_CANDIDATS_SUCCESS (state, list) {
      state.candidats.isFetching = false
      state.candidats.list = list
    },
    FETCH_AUTOCOMPLETE_CANDIDATS_FAILURE (state, error) {
      state.candidats.isFetching = false
      state.candidats.error = error
    },

    FETCH_CANDIDAT_INFO_REQUEST (state) {
      state.candidats.selected = null
    },
    FETCH_CANDIDAT_INFO_SUCCESS (state, candidat) {
      state.candidats.selected = candidat
    },
    FETCH_CANDIDAT_INFO_FAILURE (state, error) {
      state.candidats.error = error
    },

    FETCH_AUTOCOMPLETE_INSPECTEURS_REQUEST (state) {
      state.inspecteurs.isFetching = true
      state.inspecteurs.error = undefined
    },
    FETCH_AUTOCOMPLETE_INSPECTEURS_SUCCESS (state, list) {
      state.inspecteurs.isFetching = false
      state.inspecteurs.list = list
    },
    FETCH_AUTOCOMPLETE_INSPECTEURS_FAILURE (state, error) {
      state.inspecteurs.isFetching = false
      state.inspecteurs.error = error
    },

    FETCH_UPDATE_CANDIDAT_EMAIL_REQUEST (state) {
      state.candidats.isFetching = true
    },
    FETCH_UPDATE_CANDIDAT_EMAIL_SUCCESS (state) {
      state.candidats.isFetching = false
    },
    FETCH_UPDATE_CANDIDAT_EMAIL_FAILURE (state) {
      state.candidats.isFetching = false
    },

    FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_REQUEST (state) {
      state.candidats.isFetching = true
    },
    FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_SUCCESS (state) {
      state.candidats.isFetching = false
    },
    FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_FAILURE (state) {
      state.candidats.isFetching = false
    },

    FETCH_REMOVE_CANDIDAT_CANBOOK_REQUEST (state) {
      state.candidats.isFetching = true
    },
    FETCH_REMOVE_CANDIDAT_CANBOOK_SUCCESS (state) {
      state.candidats.isFetching = false
    },
    FETCH_REMOVE_CANDIDAT_CANBOOK_FAILURE (state) {
      state.candidats.isFetching = false
    },

    FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_REQUEST (state) {
      state.candidats.isFetching = true
    },
    FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_SUCCESS (state) {
      state.candidats.isFetching = false
    },
    FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_FAILURE (state) {
      state.candidats.isFetching = false
    },
    FETCH_CANDIDATS_BY_IPCSR_DATE_REQUEST (state) {
      state.candidatsByIpcsrDate.isFetching = true
    },
    FETCH_CANDIDATS_BY_IPCSR_DATE_SUCCESS (state, list) {
      state.candidatsByIpcsrDate.list = list
      state.candidatsByIpcsrDate.isFetching = false
    },
    FETCH_CANDIDATS_BY_IPCSR_DATE_FAILURE (state) {
      state.candidatsByIpcsrDate.isFetching = false
    },
  },

  actions: {
    async FETCH_AUTOCOMPLETE_CANDIDATS_REQUEST (
      { commit, rootState: { admin: { departements } } },
      { search, startingWith, endingWith },
    ) {
      try {
        const departement = departements.active || departements.list[0]
        const list = await api.admin.searchCandidats(search, departement, startingWith, endingWith)
        commit(FETCH_AUTOCOMPLETE_CANDIDATS_SUCCESS, list)
      } catch (error) {
        commit(FETCH_AUTOCOMPLETE_CANDIDATS_FAILURE, error)
      }
    },

    async FETCH_CANDIDAT_INFO_REQUEST ({ commit, rootState: { admin: { departements } } }, id) {
      try {
        const departement = departements.active || departements.list[0]
        const { candidat } = await api.admin.getCandidats(id, departement)
        commit(FETCH_CANDIDAT_INFO_SUCCESS, candidat)
      } catch (error) {
        commit(FETCH_CANDIDAT_INFO_FAILURE, error)
      }
    },

    async FETCH_AUTOCOMPLETE_INSPECTEURS_REQUEST (
      { commit, rootState: { admin: { departements } } },
      { search, startingWith, endingWith },
    ) {
      try {
        const departement = departements.active || departements.list[0]
        const list = await api.admin.searchInspecteurs(search, departement, startingWith, endingWith)
        commit(FETCH_AUTOCOMPLETE_INSPECTEURS_SUCCESS, list)
      } catch (error) {
        commit(FETCH_AUTOCOMPLETE_INSPECTEURS_FAILURE, error)
      }
    },

    async FETCH_UPDATE_CANDIDAT_EMAIL_REQUEST ({ commit, dispatch, rootState: { admin: { departements } }, state }, email) {
      try {
        commit(FETCH_UPDATE_CANDIDAT_EMAIL_REQUEST)
        const id = state.candidats.selected?._id
        if (!id) {
          throw new Error('Informations manquante pour ce candidat')
        }
        const { success, message } = await api.admin.updateCandidatEmail(id, email)
        if (!success) {
          throw new Error(message)
        }
        dispatch(SHOW_SUCCESS, message)
        commit(FETCH_UPDATE_CANDIDAT_EMAIL_SUCCESS)
        dispatch(FETCH_CANDIDAT_INFO_REQUEST, id)
      } catch (error) {
        dispatch(SHOW_ERROR, error.message)
        commit(FETCH_UPDATE_CANDIDAT_EMAIL_FAILURE, error)
        throw error
      }
    },

    async FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_REQUEST ({ commit, dispatch, rootState: { admin: { departements } }, state }, homeDepartement) {
      try {
        commit(FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_REQUEST)
        const id = state.candidats.selected?._id

        if (!id) {
          throw new Error('Informations manquante pour ce candidat')
        }

        const { success, message } = await api.admin.updateCandidatHomeDepartement(id, homeDepartement)
        if (!success) {
          throw new Error(message)
        }

        dispatch(SHOW_SUCCESS, message)
        commit(FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_SUCCESS)
        dispatch(FETCH_CANDIDAT_INFO_REQUEST, id)
      } catch (error) {
        dispatch(SHOW_ERROR, error.message)
        commit(FETCH_UPDATE_CANDIDAT_HOME_DEPARTEMENT_FAILURE, error)
        throw error
      }
    },

    async FETCH_REMOVE_CANDIDAT_CANBOOK_REQUEST ({ commit, dispatch, rootState: { admin: { departements } }, state }) {
      try {
        commit(FETCH_REMOVE_CANDIDAT_CANBOOK_REQUEST)
        const id = state.candidats.selected?._id

        if (!id) {
          throw new Error('Informations manquante pour ce candidat')
        }

        const { success, message } = await api.admin.removeCandidatPenalty(id)

        if (!success) {
          throw new Error(message)
        }

        dispatch(SHOW_SUCCESS, message)
        commit(FETCH_REMOVE_CANDIDAT_CANBOOK_SUCCESS)
        dispatch(FETCH_CANDIDAT_INFO_REQUEST, id)
      } catch (error) {
        dispatch(SHOW_ERROR, error.message)
        commit(FETCH_REMOVE_CANDIDAT_CANBOOK_FAILURE, error)
        throw error
      }
    },

    async FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_REQUEST ({ commit, dispatch, rootState: { admin: { departements } }, state }, phoneNumber) {
      try {
        commit(FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_REQUEST)
        const id = state.candidats.selected?._id

        if (!id) {
          throw new Error('Informations manquante pour ce candidat')
        }

        const { success, message } = await api.admin.updateCandidatPhoneNumber(id, phoneNumber)
        if (!success) {
          throw new Error(message)
        }

        dispatch(SHOW_SUCCESS, message)
        commit(FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_SUCCESS)
        dispatch(FETCH_CANDIDAT_INFO_REQUEST, id)
      } catch (error) {
        dispatch(SHOW_ERROR, error.message)
        commit(FETCH_UPDATE_CANDIDAT_PHONE_NUMBER_FAILURE, error)
        throw error
      }
    },

    async FETCH_CANDIDATS_BY_IPCSR_DATE_REQUEST ({ commit, dispatch }, { ipcsr, date }) {
      try {
        commit(FETCH_CANDIDATS_BY_IPCSR_DATE_REQUEST)
        const { success, message, archivedPlaces } = await api.admin.getInfoPlacesExamByIpcsrAndDate(ipcsr, date)
        if (!success) {
          throw new Error(message)
        }

        dispatch(SHOW_SUCCESS, message)
        commit(FETCH_CANDIDATS_BY_IPCSR_DATE_SUCCESS, archivedPlaces)
      } catch (error) {
        dispatch(SHOW_ERROR, error.message)
        commit(FETCH_CANDIDATS_BY_IPCSR_DATE_FAILURE, error)
        throw error
      }
    },
  },
}
