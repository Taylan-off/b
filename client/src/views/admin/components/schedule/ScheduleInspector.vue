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
        Semaine {{ currentWeekNumber }}
        <v-btn
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
            lazy
            transition="scale-transition"
            offset-y
            full-width
            max-width="290px"
            min-width="290px"
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                v-model="computedDateFormatted"
                persistent-hint
                prepend-icon="event"
                readonly
                v-on="on"
              />
            </template>
            <v-date-picker v-model="date" no-title @input="datePicker = false" locale="fr"/>
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

    <div >
      <div class="u-flex  u-flex--center  u-flex--space-between">
        <h3>Centres d'examen</h3>
        <generate-inspecteur-bordereaux
          :date="date"
          :isForInspecteurs="true"
        />
        <generate-inspecteur-bordereaux
          :date="date"
          :isForInspecteurs="false"
        />
        <div class="stats-card">
          <div class="text-xs-right">
            <refresh-button
              @click="reloadWeekMonitor"
              :isLoading="isLoading"
            />
          </div>
        </div>
      </div>

      <v-tabs
        class="tabs"
        v-model="activeCentreTab"
        color="white"
        slider-color="red"
      >
        <v-tab
          v-for="element in placesByCentreList"
          :key="element.centre._id"
          @click="centreSelector(element.centre._id)"
          :href="`#tab-${element.centre._id.toString()}`"
          ripple
        >
          {{ element.centre.nom }}
        </v-tab>

        <v-tabs-items
          v-model="activeCentreTab"
        >
          <v-tab-item
            v-for="placesByCentre in placesByCentreList"
            :key="placesByCentre.centre._id"
            :lazy="true"
            :value="`tab-${placesByCentre.centre._id}`"
          >
            <table class="table u-full-width">
              <thead>
                <tr>
                  <th v-for="creneau in headers" :key="creneau">
                    {{ creneau }}
                  </th>
                </tr>
              </thead>

              <tbody v-for="inspecteurData in inspecteursData" :key="inspecteurData.matricule">
                <tr>
                  <th
                    class="inspecteur-button"
                    :class="{ active: deleteMode && activeInspecteurRow === inspecteurData._id }"
                  >
                    <v-layout row>
                      <span class="name-ipcsr-wrap">
                        {{inspecteurData.prenom}}
                        {{inspecteurData.nom}}
                      </span>
                      <v-btn
                        icon
                        @click="activeDeleteMode(inspecteurData._id, inspecteurData)"
                      >
                        <v-icon size="20" color="#A9A9A9">delete</v-icon>
                      </v-btn>
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
                      :selectedDate="date"
                      :inspecteurId="inspecteurData._id"
                      :updateContent="reloadWeekMonitor"
                      :centreInfo="placeInfo.centre"
                      @click="setActiveInspecteurRow"
                    />
                  </td>
                </tr>

                <tr>
                  <td
                    v-if="deleteMode"
                    class="inspecteur-button"
                    :class="{ active: deleteMode && activeInspecteurRow === inspecteurData._id }"
                  ></td>

                  <td colspan="20">
                    <div class="place-details  u-flex  u-flex--center" :class="{ active: activeInspecteurRow === inspecteurData._id }">
                      <schedule-inspector-details
                        v-if="!deleteMode"
                        :place="activePlace"
                        :content="selectedPlaceInfo"
                        :close-dialog="closeDetails"
                        :selectedDate="date"
                        :updateContent="reloadWeekMonitor"
                        :inspecteurId="inspecteurData._id"
                        :centreInfo="placesByCentre.centre"
                      />
                      <delete-schedule-inspector
                        v-if="deleteMode"
                        :placeInfo="inspecteurData"
                        :inspecteurId="inspecteurData._id"
                        :closeDetails="closeDetails"
                        @reloadWeekMonitor="reloadWeekMonitor"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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
  FETCH_INSPECTEURS_BY_DEPARTEMENT_REQUEST,
  SELECT_CENTER,
  FETCH_CANDIDAT_REQUEST,
  RESET_CANDIDAT,
} from '@/store'

import DeleteScheduleInspector from './DeleteScheduleInspector'
import GenerateInspecteurBordereaux from './GenerateInspecteurBordereaux'
import ScheduleInspectorButton from './ScheduleInspectorButton'
import ScheduleInspectorDetails from './ScheduleInspectorDetails'
import { RefreshButton } from '@/components'

import {
  creneauSetting,
  getFrenchLuxonCurrentDateTime,
  getFrenchLuxonFromIso,
  getFrenchLuxonFromObject,
  getFrenchLuxonFromSql,
} from '@/util'

const creneauTemplate = [
  'Inspecteurs',
  ...creneauSetting,
]

export default {
  components: {
    DeleteScheduleInspector,
    GenerateInspecteurBordereaux,
    RefreshButton,
    ScheduleInspectorButton,
    ScheduleInspectorDetails,
  },

  data () {
    return {
      activeCentreId: undefined,
      activeCentreTab: undefined,
      activeHour: undefined,
      activeInspecteurRow: undefined,
      activePlace: undefined,
      currentWeekNumber: getFrenchLuxonCurrentDateTime().weekNumber,
      date: getFrenchLuxonCurrentDateTime().toISODate(),
      datePicker: false,
      deleteMode: false,
      flagModal: 'check',
      headers: undefined,
      inspecteursData: [],
      isAvailable: true,
      isBooked: false,
      isComputing: false,
      isParseInspecteursPlanningLoading: false,
      selectedPlaceInfo: undefined,
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
          places.isCreating
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
    }),

    computedDateFormatted () {
      return this.formatDate(this.date)
    },

    isLoading () {
      return this.isFetching ||
        this.isComputing
    },
  },

  methods: {
    formatDate (date) {
      if (!date) return null
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
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
      const { centre } = this.placesByCentreList.find(placesByCentre => placesByCentre.centre._id === centreId)
      await this.$store.dispatch(SELECT_CENTER, centre)
    },

    async reloadWeekMonitor () {
      const begin = getFrenchLuxonFromSql(this.date).startOf('day').toISO()
      const end = getFrenchLuxonFromSql(this.date).endOf('day').toISO()
      await this.$store
        .dispatch(FETCH_ADMIN_DEPARTEMENT_ACTIVE_INFO_REQUEST, { begin, end })
      this.parseInspecteursPlanning()
    },

    async centreSelector (centreId) {
      this.$router.push({ params: { center: centreId, date: this.date } })
      this.activeCentreId = centreId
      await this.updateStoreCenterSelected(centreId)
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
          const filteredCreneaux = dayPlaces.filter(plce => inspecteur._id === plce.inspecteur).map(place => {
            const currentHourString = getFrenchLuxonFromIso(place.date).toFormat("HH'h'mm")
            if (creneaux.some(crn => crn === currentHourString)) {
              return {
                place,
                hour: currentHourString,
              }
            }
          }).filter(plce => plce)
          if (filteredCreneaux.length < 13) {
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
              if (currentCreneau.hour < creneauToCompare.hour) {
                return -1
              }
              if (currentCreneau.hour > creneauToCompare.hour) {
                return 1
              }
              return 0
            }),
          }
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
      this.deleteMode = true
      this.activeInspecteurRow = inspecteurId
    },
  },

  watch: {
    async date (newDay) {
      this.$router.push({ params: { date: newDay } })
      const dateTimeFromSQL = getFrenchLuxonFromSql(newDay)
      this.currentWeekNumber = dateTimeFromSQL.weekNumber
      if (this.$store.state.admin.departements.active) {
        const begin = dateTimeFromSQL.startOf('day').toISO()
        const end = dateTimeFromSQL.endOf('day').toISO()
        await this.$store
          .dispatch(FETCH_ADMIN_DEPARTEMENT_ACTIVE_INFO_REQUEST, { begin, end })
        this.activeCentreId = (this.$route.params.center) || this.firstCentreId
        this.activeCentreTab = `tab-${this.activeCentreId}`
        await this.updateStoreCenterSelected(this.activeCentreId)
        this.parseInspecteursPlanning()
      }
    },

    async activeDepartement (newValue, oldValue) {
      const dateTimeFromSQL = getFrenchLuxonFromSql(this.date)
      const begin = dateTimeFromSQL.startOf('day').toISO()
      const end = dateTimeFromSQL.endOf('day').toISO()
      await this.$store.dispatch(FETCH_INSPECTEURS_BY_DEPARTEMENT_REQUEST)
      await this.$store
        .dispatch(FETCH_ADMIN_DEPARTEMENT_ACTIVE_INFO_REQUEST, { begin, end })
      const { center } = this.$route.params
      if (!this.placesByCentreList.some(el => el.centre._id === center)) {
        this.activeCentreId = this.firstCentreId
        this.activeCentreTab = `tab-${this.activeCentreId}`
      } else {
        this.activeCentreId = center
        this.activeCentreTab = `tab-${center}`
      }
      await this.updateStoreCenterSelected(this.activeCentreId)
      this.parseInspecteursPlanning()
    },
  },

  async mounted () {
    await this.$store.dispatch(FETCH_INSPECTEURS_BY_DEPARTEMENT_REQUEST)
    const centerId = this.$route.params.center
    this.activeCentreId = (centerId) || this.firstCentreId
    this.activeCentreTab = `tab-${this.activeCentreId}`
    this.parseInspecteursPlanning()
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
}
</script>

<style lang="stylus" scoped>
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
  margin-left: 10%;
  margin-top: 7%;
  min-width: 60%;
}
</style>