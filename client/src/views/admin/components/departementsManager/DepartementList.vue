<template>
  <div class="u-max-width">
    <page-title :title="'Liste de département'" />
    <create-departement class="create-departement-bar" />
    <v-data-table
      class="u-centered text-uppercase pa-5"
      :headers="headers"
      :items="departements"
      :items-per-page="8"
    >
      <template #[`item.isAddedRecently`]="{ item }">
        <v-icon color="green">
          {{ item.isAddedRecently? 'check': '' }}
        </v-icon>
      </template>

      <template #[`item.action`]="{ item }">
        <update-departement
          :is-disable-at="false"
          :deprt-id="item._id"
          :deprt="item"
          @update-departement="updateDepartement"
        />
        <delete-departement :departement-id="item._id" />
      </template>

      <template #[`item.disableAt`]="{ item }">
        <update-departement-date-disable-at
          :departement="item"
          @update-departement="updateDepartement"
        />
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import { FETCH_DEPARTEMENTS_BY_ADMIN_REQUEST, UPDATE_DEPARTEMENT_REQUEST } from '@/store'
import CreateDepartement from './CreateDepartement'
import UpdateDepartement from './UpdateDepartement'
import DeleteDepartement from './DeleteDepartement'
import UpdateDepartementDateDisableAt from './UpdateDepartementDateDisableAt'

export default {
  name: 'DepartementList',

  components: {
    CreateDepartement,
    UpdateDepartement,
    DeleteDepartement,
    UpdateDepartementDateDisableAt,
  },

  data () {
    return {
      departements: this.departementList,
      headers: [
        {
          text: 'Département',
          sortable: false,
          value: '_id',
        },
        { text: 'Email', sortable: false, value: 'email' },
        { text: 'Récent', sortable: true, value: 'isAddedRecently' },
        { text: 'Actions', sortable: false, value: 'action' },
        { text: 'Date de désactivation', sortable: false, value: 'disableAt' },
      ],
    }
  },

  computed: {
    ...mapState({
      isCreating: state => state.adminDepartements.isCreating,
      isFetching: state => state.adminDepartements.isFetching,
      isUpdating: state => state.adminDepartements.isUpdating,
      isDeleting: state => state.adminDepartements.isDeleting,
      departementList: state => state.adminDepartements.list,
    }),
  },

  watch: {
    departementList (newValue) {
      this.departements = newValue
    },
    isCreating (newValue, oldValue) {
      if (oldValue === true && newValue === false) {
        this.getAllDepartement()
      }
    },
    isUpdating (newValue, oldValue) {
      if (oldValue === true && newValue === false) {
        this.getAllDepartement()
      }
    },
    isDeleting (newValue, oldValue) {
      if (oldValue === true && newValue === false) {
        this.getAllDepartement()
      }
    },
  },

  mounted () {
    this.getAllDepartement()
  },
  methods: {
    getAllDepartement () {
      this.$store.dispatch(FETCH_DEPARTEMENTS_BY_ADMIN_REQUEST)
    },
    async updateDepartement (event) {
      const {
        departementId,
        newEmail,
        isAddedRecently,
        disableAt,
      } = event

      await this.$store.dispatch(UPDATE_DEPARTEMENT_REQUEST, {
        departementId,
        newEmail,
        isAddedRecently,
        disableAt,
      })
    },
  },
}
</script>

<style scoped>
table {
  margin-top: 30px;
  width: 90%;
  border-collapse: collapse;
}

thead {
  border: 1px solid;
  background-color: #4eb5c5;
}

td {
  padding: 10px;
  border: 1px solid grey;
}

.text-white {
  color: white !important;
}

.create-departement-bar {
  position: sticky;
  top: 4.5em;
  z-index: 3;
  margin-top: 0.5em;
}
</style>
