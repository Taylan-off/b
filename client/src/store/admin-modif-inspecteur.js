import api from '@/api'
import { SHOW_ERROR, SHOW_SUCCESS } from '@/store'

export const FETCH_GET_INSPECTEURS_AVAILABLE_REQUEST = 'FETCH_GET_INSPECTEURS_AVAILABLE_REQUEST'
export const FETCH_GET_INSPECTEURS_AVAILABLE_SUCCESS = 'FETCH_GET_INSPECTEURS_AVAILABLE_SUCCESS'
export const FETCH_GET_INSPECTEURS_AVAILABLE_FAILURE = 'FETCH_GET_INSPECTEURS_AVAILABLE_FAILURE'

export const FETCH_UPDATE_INSPECTEUR_IN_RESA_REQUEST = 'FETCH_UPDATE_INSPECTEUR_IN_RESA_REQUEST'
export const FETCH_UPDATE_INSPECTEUR_IN_RESA_SUCCESS = 'FETCH_UPDATE_INSPECTEUR_IN_RESA_SUCCESS'
export const FETCH_UPDATE_INSPECTEUR_IN_RESA_FAILURE = 'FETCH_UPDATE_INSPECTEUR_IN_RESA_FAILURE'

export default {
  state: {
    inspecteurs: {
      isFetching: false,
      list: [],
      error: undefined,
    },
    isUpdating: false,
    error: undefined,

  },

  mutations: {
    FETCH_GET_INSPECTEURS_AVAILABLE_REQUEST (state) {
      state.inspecteurs.isFetching = true
    },
    FETCH_GET_INSPECTEURS_AVAILABLE_SUCCESS (state, list) {
      state.inspecteurs.isFetching = false
      state.inspecteurs.list = list
    },
    FETCH_GET_INSPECTEURS_AVAILABLE_FAILURE (state, error) {
      state.inspecteurs.isFetching = false
      state.inspecteurs.error = error
    },
    FETCH_UPDATE_INSPECTEUR_IN_RESA_REQUEST (state) {
      state.isUpdating = true
    },
    FETCH_UPDATE_INSPECTEUR_IN_RESA_SUCCESS (state) {
      state.isUpdating = false
    },
    FETCH_UPDATE_INSPECTEUR_IN_RESA_FAILURE (state, error) {
      state.isUpdating = false
      state.error = error
    },

  },

  actions: {
    async FETCH_GET_INSPECTEURS_AVAILABLE_REQUEST ({ state, commit, dispatch }, { departement, centre, date, slectedInspecteurId, inspecteursData }) {
      try {
        commit(FETCH_GET_INSPECTEURS_AVAILABLE_REQUEST)

        let list

        if (slectedInspecteurId && inspecteursData && inspecteursData.length) {
          const selectedInspecteur = inspecteursData.find(inspecteur => inspecteur._id === slectedInspecteurId)

          const ipscrCreneauHour = selectedInspecteur.creneau
            .filter(itm => itm?.place?.candidat)
            .map(itm => itm.hour)

          list = inspecteursData
            .filter(el => el._id !== slectedInspecteurId)
            .reduce((accu, inspecteur) => {
              const hourToCheck = inspecteur.creneau
                .filter(itm => itm?.place && !itm?.place?.candidat)
                .map(item => item.hour)

              const isHaveAllPlaces = !ipscrCreneauHour.filter(hour => !hourToCheck.includes(hour)).length
              if (isHaveAllPlaces) {
                accu.push(inspecteur)
              }
              return accu
            }, [])

          if (!list.length) {
            commit(FETCH_GET_INSPECTEURS_AVAILABLE_SUCCESS, [])
            throw new Error('Aucun inspecteur disponible, Il vous faut un inspecteur avec la totalité de ses créneaux disponibles.')
          }
        } else {
          const places = await api.admin.getPlacesAvailableByCentreAndDate(departement, centre, date)
          list = places.map(place => place.inspecteur)
        }

        commit(FETCH_GET_INSPECTEURS_AVAILABLE_SUCCESS, list)
      } catch (error) {
        commit(FETCH_GET_INSPECTEURS_AVAILABLE_FAILURE, error)
        dispatch(SHOW_ERROR, error.message)
      }
    },

    async FETCH_UPDATE_INSPECTEUR_IN_RESA_REQUEST ({ state, commit, dispatch }, { departement, resa, inspecteur }) {
      try {
        commit(FETCH_UPDATE_INSPECTEUR_IN_RESA_FAILURE)

        if (resa instanceof Array) {
          // TODO: If is needed get result of patch request
          await Promise.all(resa.map(async itemResa => (await api.admin.updateInspecteurForResa(departement, itemResa._id, inspecteur._id))))
        } else {
          const result = await api.admin.updateInspecteurForResa(departement, resa, inspecteur)
          commit(FETCH_UPDATE_INSPECTEUR_IN_RESA_SUCCESS)
          dispatch(result.success ? SHOW_SUCCESS : SHOW_ERROR, result.message)
        }
      } catch (error) {
        commit(FETCH_GET_INSPECTEURS_AVAILABLE_FAILURE, error)
        dispatch(SHOW_ERROR, error.message)
      }
    },

  },
}
