<template>
  <v-container grid-list-md>
    <div>
      <h2 class="text--center">
        <v-btn
          icon
          @click="goto('-1 weeks')"
        >
          <v-icon
            color="grey darken"
          >
            fast_rewind
          </v-icon>
        </v-btn>
        Semaine {{ displayOnlyNumberOfWeek() }}
        <v-btn
          class="t-btn-next-week"
          icon
          @click="goto('+1 weeks')"
        >
          <v-icon
            color="grey darken"
          >
            fast_forward
          </v-icon>
        </v-btn>
      </h2>

      <div class="date-selector">
        <div class="date-input  u-flex  u-flex--center">
          <v-btn
            icon
            @click="goto('-1 days')"
          >
            <v-icon
              color="grey darken"
              style="transform: rotate(0.5turn);"
            >
              play_arrow
            </v-icon>
          </v-btn>

          <v-menu
            v-model="datePicker"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            max-width="290px"
            min-width="290px"
          >
            <template #activator="{ on }">
              <v-text-field
                v-model="pickerDate"
                class="t-date-picker"
                persistent-hint
                prepend-icon="event"
                readonly
                v-on="on"
              />
            </template>
            <v-date-picker
              v-model="date"
              no-title
              locale="fr"
              @input="datePicker = false"
            />
          </v-menu>
          <v-btn
            icon
            @click="goto('+1 days')"
          >
            <v-icon
              color="grey darken"
            >
              play_arrow
            </v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <div>
      <div class="flex flex-wrap u-flex--center">
        <h3>Centres d'examen</h3>
        <generate-inspecteur-bordereaux
          :date="date"
          :is-for-inspecteurs="true"
        />
        <modal-add-schedule-inspecteur
          :active-centre-infos="{_id: activeCentreId, nom: activeNomCentre, departement: activeDepartement}"
          :selected-date="date"
          @reload-week-monitor="reloadWeekMonitor"
        />

        <generate-inspecteur-bordereaux
          :date="date"
          :is-for-inspecteurs="false"
        />
        <div class="stats-card">
          <div class="text-xs-right">
            <refresh-button
              :is-loading="isLoading"
              @click="reloadWeekMonitor"
            />
          </div>
        </div>
      </div>

      <big-loading-indicator :is-loading="isLoading" />

      <v-tabs
        v-model="activeCentreTab"
        class="tabs t-center-tabs"
        color="dark"
        slider-color="#f82249"
      >
        <v-tab
          v-for="element in placesByCentreList"
          :key="element.centre._id"
          :href="`#tab-${element.centre._id.toString()}`"
          ripple
          :disabled="isLoading"
          :aria-disabled="isLoading"
          @click="centreSelector(element.centre._id)"
        >
          {{ element.centre.nom }}
        </v-tab>

        <v-tabs-items
          v-model="activeCentreTab"
        >
          <v-tab-item
            v-for="placesByCentre in placesByCentreList"
            :key="placesByCentre.centre._id"
            :value="`tab-${placesByCentre.centre._id}`"
          >
            <v-card
              class="center-content-wrapper pa-1"
            >
              <table
                class="table u-full-width"
                :style="{ opacity: isLoading ? '0.5' : '1' }"
              >
                <thead>
                  <tr>
                    <th
                      v-for="creneau in headers"
                      :key="creneau"
                    >
                      {{ creneau }}
                    </th>
                  </tr>
                </thead>

                <tbody
                  v-for="inspecteurData in inspecteursData"
                  :key="inspecteurData.matricule"
                >
                  <tr>
                    <th
                      class="inspecteur-button"
                      :class="{ active: (deleteMode || permuteMode) && activeInspecteurRow === inspecteurData._id }"
                    >
                      <v-layout row>
                        <v-tooltip bottom>
                          {{ inspecteurData.prenom + ' ' + inspecteurData.nom }}
                          <template #activator="{ on }">
                            <span
                              class="name-ipcsr-wrap"
                              v-on="on"
                            >
                              {{ inspecteurData.prenom }}
                              {{ inspecteurData.nom }}
                            </span>
                          </template>
                        </v-tooltip>

                        <v-tooltip bottom>
                          Réaffecter les places de l'inspecteur
                          <template #activator="{ on }">
                            <v-btn
                              :class="`t-permute-btn-${inspecteurData.nom}`"
                              icon
                              v-on="on"
                              @click="activePermuteMode(inspecteurData._id, inspecteurData)"
                            >
                              <v-icon
                                size="20"
                                color="#A9A9A9"
                              >
                                schedule_send
                              </v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>

                        <v-btn
                          :class="`t-delete-btn-${inspecteurData.nom}`"
                          icon
                          @click="activeDeleteMode(inspecteurData._id, inspecteurData)"
                        >
                          <v-icon
                            size="20"
                            color="#A9A9A9"
                          >
                            delete
                          </v-icon>
                        </v-btn>
                        <v-tooltip bottom>
                          Information candidats
                          <template #activator="{ on }">
                            <v-btn
                              v-if="getCreneauCandidatIds(inspecteurData).length"
                              :class="`t-info-candidat-btn-${inspecteurData.nom}`"
                              icon
                              v-on="on"
                              @click="activeInofCandidatsMode(inspecteurData._id, inspecteurData)"
                            >
                              <v-icon
                                size="20"
                                color="#A9A9A9"
                              >
                                face
                              </v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                      </v-layout>
                    </th>
                    <td
                      v-for="placeInfo in inspecteurData.creneau"
                      :key="placeInfo._id"
                      class="place-button"
                      :class="{ active: activeInspecteurRow === inspecteurData._id && activeHour === placeInfo.hour }"
                    >
                      <schedule-inspector-button
                        :key="`creneau-${placeInfo.hour}-${inspecteurData._id}`"
                        :content="placeInfo"
                        :selected-date="date"
                        :inspecteur-id="inspecteurData._id"
                        :update-content="reloadWeekMonitor"
                        :centre-info="placeInfo.centre"
                        @click="setActiveInspecteurRow"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td
                      v-if="deleteMode"
                      class="inspecteur-button"
                      :class="{ active: deleteMode && activeInspecteurRow === inspecteurData._id }"
                    />

                    <td colspan="20">
                      <div
                        class="place-details  u-flex  u-flex--center"
                        :class="{ active: activeInspecteurRow === inspecteurData._id }"
                      >
                        <schedule-inspector-details
                          v-if="!deleteMode && !permuteMode && !infosCandidatsMode"
                          :place="activePlace"
                          :content="selectedPlaceInfo"
                          :close-dialog="closeDetails"
                          :selected-date="date"
                          :update-content="reloadWeekMonitor"
                          :inspecteur-id="inspecteurData._id"
                          :centre-info="placesByCentre.centre"
                        />
                        <delete-schedule-inspector
                          v-if="deleteMode && !permuteMode"
                          :place-info="inspecteurData"
                          :inspecteur-id="inspecteurData._id"
                          :close-details="closeDetails"
                          @reloadWeekMonitor="reloadWeekMonitor"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      v-if="permuteMode && !deleteMode"
                      class="inspecteur-button"
                      :class="{ active: permuteMode && activeInspecteurRow === inspecteurData._id }"
                    />

                    <td colspan="20">
                      <div
                        class="place-details  u-flex  u-flex--center"
                        :class="{ active: permuteMode && activeInspecteurRow === inspecteurData._id }"
                      >
                        <permute-inspector
                          v-if="(permuteMode && !deleteMode) && activeInspecteurRow === inspecteurData._id"
                          :inspecteur-id="inspecteurData._id"
                          :centre-id="activeCentreId"
                          :inspecteurs-data="inspecteursData"
                          :is-editing="permuteMode"
                          :active-departement="activeDepartement"
                          :update-content="reloadWeekMonitor"
                          :close-dialog="closeDetails"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr
                    v-if="infosCandidatsMode && !permuteMode && !deleteMode && activeInspecteurRow === inspecteurData._id"
                  >
                    <td
                      class="inspecteur-button"
                      :class="{ active: infosCandidatsMode && activeInspecteurRow === inspecteurData._id }"
                    />

                    <td colspan="20">
                      <div
                        class="place-details  u-flex  u-flex--center overflow-auto"
                        :class="{ active: infosCandidatsMode && activeInspecteurRow === inspecteurData._id }"
                      >
                        <schedule-ipcsr-info-candidats :creneau-candidat-ids="getCreneauCandidatIds(inspecteurData)" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
      </v-tabs>
    </div>
  </v-container>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import {
  FETCH_ADMIN_DEPARTEMENT_ACTIVE_INFO_REQUEST,
  FETCH_INSPECTEURS_BY_CENTRE_REQUEST,
  SELECT_CENTER,
  FETCH_CANDIDAT_REQUEST,
  RESET_CANDIDAT,
} from '@/store'

import { RefreshButton, BigLoadingIndicator } from '@/components'
import DeleteScheduleInspector from './DeleteScheduleInspector'
import GenerateInspecteurBordereaux from './GenerateInspecteurBordereaux'
import ScheduleInspectorButton from './ScheduleInspectorButton'
import ScheduleInspectorDetails from './ScheduleInspectorDetails'
import ModalAddScheduleInspecteur from './ModalAddScheduleInspecteur'
import PermuteInspector from './PermuteInspector'
import ScheduleIpcsrInfoCandidats from './ScheduleIpcsrInfoCandidats.vue'

import {
  creneauSetting,
  getFrenchLuxonCurrentDateTime,
  getFrenchLuxonFromIso,
  getFrenchLuxonFromObject,
  getFrenchLuxonFromSql,
  callBackCatchRouter,
  checkForHexRegexp,
} from '@/util'

const creneauTemplate = [
  'Inspecteurs',
  ...creneauSetting,
]

const numberOfCreneau = creneauSetting.length || 0

export default {
  components: {
    BigLoadingIndicator,
    DeleteScheduleInspector,
    GenerateInspecteurBordereaux,
    RefreshButton,
    ScheduleInspectorButton,
    ScheduleInspectorDetails,
    ModalAddScheduleInspecteur,
    PermuteInspector,
    ScheduleIpcsrInfoCandidats,
  },

  data () {
    return {
      activeCentreId: undefined,
      activeCentreTab: undefined,
      activeHour: undefined,
      activeInspecteurRow: undefined,
      activePlace: undefined,
      currentWeekNb: (this.$route.params.date ? getFrenchLuxonFromSql(this.$route.params.date) : getFrenchLuxonCurrentDateTime()).toISOWeekDate().split('-'),
      date: this.$route.params.date || getFrenchLuxonCurrentDateTime().toISODate(),
      datePicker: false,
      deleteMode: false,
      permuteMode: false,
      infosCandidatsMode: false,
      headers: undefined,
      inspecteursData: [],
      isAvailable: true,
      isBooked: false,
      isComputing: false,
      isParseInspecteursPlanningLoading: false,
      selectedPlaceInfo: undefined,
      lastActiveCenters: [],
      selectedCreneau: [],
    }
  },

  computed: {
    ...mapGetters(['activeDepartement']),
    ...mapState({
      isFetching (state) {
        const {
          places,
          inspecteurs,
        } = state.admin
        return places.isFetching ||
          inspecteurs.isFetching ||
          places.isDeletingBookedPlace ||
          places.isDeletingAvailablePlace ||
          places.isCreating || state.adminSearch.isFetching
      },

      currentWeekNumber () {
        return `${this.currentWeekNb[0]}-${this.currentWeekNb[1]}`
      },

      placesByCentreList (state) {
        return state.admin.places.list
      },

      firstCentreId (state) {
        const firstEntry = state.admin.places.list[0]
        return firstEntry && firstEntry.centre._id
      },

      inspecteurs (state) {
        return state.admin.inspecteurs.list
      },
      inspecteursFullList (state) {
        return state.adminSearch.inspecteurs.list.map(inspecteur => {
          const { nom, prenom, matricule } = inspecteur
          const nomPrenomMatricule = nom + '  ' + prenom + ' | ' + matricule
          return { nomPrenomMatricule, ...inspecteur }
        })
      },
    }),

    beginDate () {
      return getFrenchLuxonFromSql(this.date).startOf('day').toISO()
    },

    endDate () {
      return getFrenchLuxonFromSql(this.date).endOf('day').toISO()
    },

    pickerDate () {
      return this.date.split('-').reverse().join('/')
    },

    isLoading () {
      return this.isFetching ||
        this.isComputing
    },
    allInspecteurs: state => state.adminSearch.inspecteurs.list,
    activeNomCentre () {
      return this.placesByCentreList.find(el => el.centre._id === this.activeCentreId)?.centre?.nom
    },
  },

  watch: {
    async date (newDay) {
      const dateTimeFromSQL = getFrenchLuxonFromSql(newDay)
      this.currentWeekNb = dateTimeFromSQL.toISOWeekDate().split('-')
      this.activeCentreId = this.$route.params.center || this.firstCentreId
      this.updateCenterInRoute()
      if (this.$store.state.admin.departements.active) {
        await this.$store
          .dispatch(FETCH_ADMIN_DEPARTEMENT_ACTIVE_INFO_REQUEST, { begin: this.beginDate, end: this.endDate })
        this.parseInspecteursPlanning()
      }
    },

    async activeDepartement (newDepartement) {
      const center = this.lastActiveCenters[newDepartement] || this.firstCentreId
      await this.$store
        .dispatch(FETCH_ADMIN_DEPARTEMENT_ACTIVE_INFO_REQUEST, { begin: this.beginDate, end: this.endDate })
      if (this.placesByCentreList.some(el => el.centre._id === center)) {
        this.activeCentreId = center
      } else {
        this.activeCentreId = this.firstCentreId
      }
      this.updateCenterInRoute()
      await this.$store.dispatch(FETCH_INSPECTEURS_BY_CENTRE_REQUEST, {
        centreId: this.activeCentreId,
        begin: this.beginDate,
        end: this.endDate,
      })

      this.parseInspecteursPlanning()
    },

    async activeCentreId (newCentreId) {
      this.lastActiveCenters[this.activeDepartement] = newCentreId
      await this.updateStoreCenterSelected(newCentreId)
      this.activeCentreTab = `tab-${newCentreId}`
    },
  },

  async mounted () {
    await this.reloadWeekMonitor()
    this.updateCenterInRoute()
    this.activeCentreInfos = {}
    this.lastActiveCenters[this.activeDepartement] = this.activeCentreId
  },

  async beforeMount () {
    this.headers = creneauTemplate

    const { currentWeek } = this.$store.state.admin

    const defaultDate = {
      weekYear: getFrenchLuxonCurrentDateTime().year,
      weekNumber: currentWeek || getFrenchLuxonCurrentDateTime().weekNumber,
      weekday: 1,
    }

    const routeDate = this.$route.params.date
    if (routeDate) {
      const [year, month, day] = this.$route.params.date.split('-')
      const date = { year, month, day }
      this.date = getFrenchLuxonFromObject(date).toISODate()
      return
    }

    this.date = getFrenchLuxonFromObject(defaultDate).toISODate()
  },

  methods: {
    displayOnlyNumberOfWeek () {
      return `${this.currentWeekNb[1].replace('W', '')}`
    },

    closeDetails () {
      this.activeInspecteurRow = undefined
      this.activeHour = undefined
    },

    goto (selectedDate) {
      const [nb, scale] = selectedDate.split(' ')
      const luxonDate = getFrenchLuxonFromIso(this.date).plus({ [scale]: +nb })
      this.date = luxonDate.toISODate()
    },

    async updateStoreCenterSelected (centreId) {
      if (this.placesByCentreList && this.placesByCentreList.length) {
        const { centre } = this.placesByCentreList.find(placesByCentre => placesByCentre.centre._id === centreId)
        await this.$store.dispatch(SELECT_CENTER, centre)
      }
    },

    async reloadWeekMonitor () {
      await this.$store
        .dispatch(FETCH_ADMIN_DEPARTEMENT_ACTIVE_INFO_REQUEST, { begin: this.beginDate, end: this.endDate })
      const centerId = checkForHexRegexp.test(this.$route.params.center) && this.$route.params.center
      this.activeCentreId = centerId || this.firstCentreId

      await this.$store.dispatch(FETCH_INSPECTEURS_BY_CENTRE_REQUEST, { centreId: this.activeCentreId, begin: this.beginDate, end: this.endDate })
      this.parseInspecteursPlanning()
    },

    async centreSelector (centreId) {
      this.$router.push({ params: { center: centreId, date: this.date } }).catch(callBackCatchRouter)
      this.activeCentreId = centreId
      this.reloadWeekMonitor()
    },

    parseInspecteursPlanning () {
      this.isComputing = true
      this.inspecteursData = []
      const [, ...creneaux] = creneauTemplate

      const dateTofind = getFrenchLuxonFromSql(this.date).toISODate()

      const activeCenterAndPlaces = this.placesByCentreList.find(placesByCentre => placesByCentre.centre._id === this.activeCentreId)
      const weekPlaces = activeCenterAndPlaces &&
        activeCenterAndPlaces.places &&
        activeCenterAndPlaces.places[this.currentWeekNumber]
      if (!weekPlaces) {
        this.isComputing = false
        return
      }

      const dayPlaces = weekPlaces.filter(plc => getFrenchLuxonFromIso(plc.date).toISODate() === dateTofind)

      if (dayPlaces && dayPlaces.length) {
        this.inspecteursData = this.inspecteurs.map(inspecteur => {
          const filteredCreneaux = dayPlaces.filter(plce => inspecteur._id === plce.inspecteur)
            .map(place => {
              const currentHourString = getFrenchLuxonFromIso(place.date).toFormat("HH'h'mm")
              if (creneaux.some(crn => crn === currentHourString)) {
                return {
                  place,
                  hour: currentHourString,
                }
              }
            })
            .filter(plce => plce)

          if (filteredCreneaux.length < numberOfCreneau) {
            creneaux.forEach(cren => {
              if (!filteredCreneaux.some(crn => crn.hour === cren)) {
                filteredCreneaux.push({
                  place: undefined,
                  hour: cren,
                })
              }
            })
          }

          return {
            ...inspecteur,
            creneau: filteredCreneaux.sort((currentCreneau, creneauToCompare) => {
              if (currentCreneau.hour < creneauToCompare.hour) return -1
              if (currentCreneau.hour > creneauToCompare.hour) return 1
              return 0
            }),
          }
        }).sort((item, itemToCompare) => {
          return item.nom.localeCompare(itemToCompare.nom)
        })
      }
      if (!this.inspecteursData.length) {
        this.inspecteursData = this.inspecteurs
      } else {
        this.inspecteursData = this.inspecteursData.filter(inspecteurInfo =>
          inspecteurInfo.creneau.some(item => item.place && item.place.centre === this.activeCentreId))
      }

      this.isComputing = false
    },

    async setActiveInspecteurRow (inspecteurId, placeInfo) {
      this.deleteMode = false
      this.permuteMode = false
      this.infosCandidatsMode = false
      const hour = placeInfo && placeInfo.hour
      const place = placeInfo && placeInfo.place
      if (this.activeInspecteurRow === inspecteurId && hour === this.activeHour) {
        this.activeInspecteurRow = undefined
        this.activeHour = undefined
        return
      }

      this.activeHour = hour
      const candidatId = place && place.candidat
      this.activeInspecteurRow = inspecteurId
      this.activeCandidatId = candidatId
      this.selectedPlaceInfo = placeInfo

      this.activePlace = place

      const departement = this.$store.state.admin.departements.active
      if (candidatId) {
        return this.$store.dispatch(FETCH_CANDIDAT_REQUEST, { candidatId, departement })
      }
      return this.$store.commit(RESET_CANDIDAT)
    },

    activeDeleteMode (inspecteurId, placeInfo) {
      this.activeHour = undefined
      if (this.deleteMode && this.activeInspecteurRow === inspecteurId) {
        this.activeInspecteurRow = undefined
        return
      }
      this.permuteMode = false
      this.deleteMode = true
      this.infosCandidatsMode = false
      this.activeInspecteurRow = inspecteurId
    },

    activePermuteMode (inspecteurId, placeInfo) {
      this.activeHour = undefined
      if (this.permuteMode && this.activeInspecteurRow === inspecteurId) {
        this.activeInspecteurRow = undefined
        return
      }
      this.deleteMode = false
      this.permuteMode = true
      this.infosCandidatsMode = false
      this.activeInspecteurRow = inspecteurId
    },

    activeInofCandidatsMode (inspecteurId, placeInfo) {
      this.activeHour = undefined
      if (this.infosCandidatsMode && this.activeInspecteurRow === inspecteurId) {
        this.activeInspecteurRow = undefined
        return
      }
      this.permuteMode = false
      this.deleteMode = false
      this.infosCandidatsMode = true
      this.activeInspecteurRow = inspecteurId
    },

    updateCenterInRoute () {
      this.$router.push({ params: { center: this.activeCentreId, date: this.date } }).catch(callBackCatchRouter)
    },

    addOrRemoveCreneauInList (creneau) {
      this.selectedCreneau = this.selectedCreneau.find(el => el === creneau)
        ? this.selectedCreneau.filter(el => el !== creneau)
        : this.selectedCreneau.concat(creneau)
    },

    getCreneauCandidatIds (inspecteurData) {
      return inspecteurData.creneau.map(creneau => ({ hour: creneau?.hour, candidat: creneau?.place?.candidat })).filter(elt => elt.candidat)
    },
  },
}
</script>

<style scoped>
.container {
  max-width: 100%;
  padding: 1px;
}

.date-input {
  width: 290px;
  margin: 0 auto;
}

.padded {
  padding: 1em;
}

.center-content-wrapper {
  overflow-x: auto;
  transform: scale(1, 1);
}

.table {
  border-collapse: collapse;
  background-color: white;
}

.page-title {
  margin-top: 4em;
}

.place-button {
  transition: all 0.6s ease-in-out;

  &.active {
    background-color: #bde;
  }
}

.inspecteur-button {
  transition: all 0.6s ease-in-out;

  &.active {
    background-color: #bde;
  }
}

.place-details {
  overflow: hidden;
  max-height: 0;
  transition: all 0.6s ease-in-out;

  &.active {
    background-color: #bde;
    max-height: 300px;
  }
}

.refresh-btn {
  margin: 1em;
}

.name-ipcsr-wrap {
  margin-left: 5%;
  margin-top: 7%;
  min-width: 60%;
}
</style>
