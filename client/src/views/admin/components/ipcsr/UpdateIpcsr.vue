<template>
  <v-dialog
    :key="ipcsrId"
    v-model="updating"
    width="1040"
    @click:outside="close"
  >
    <template #activator="{ on }">
      <v-btn
        slot="activator"
        class="t-btn-update"
        color="primary"
        icon
        v-on="on"
      >
        <v-icon>edit</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title
        class=" t-title-update headline grey lighten-2"
        primary-title
      >
        Modification de {{ prenom }} {{ nom }} {{ matricule }} ({{ departement }})
      </v-card-title>

      <v-form
        v-model="valid"
        class="t-update-ipcsr-form"
      >
        <v-container class="pa-5 flex flex-wrap">
          <v-text-field
            v-model="email"
            class="t-input-ipcsr-email pa-3"
            prepend-icon="email"
            aria-placeholder="jean@dupont.fr"
            hint="ex. : jean@dupont.fr"
            tabindex="0"
            :rules="emailRules"
            label="Adresse courriel principale"
            :placeholder="emailPlaceholder"
            required
            @focus="setEmailPlaceholder"
            @blur="removeEmailPlaceholder"
            @input="setEmailToLowerCase"
          />

          <v-spacer />

          <v-text-field
            v-model="prenom"
            class="pa-3 t-input-prenom"
            prepend-icon="perm_identity"
            hint="ex. : Jean"
            tabindex="0"
            label="Prénom"
            :aria-placeholder="prenomPlaceholder"
            :placeholder="prenomPlaceholder"
            required
            @focus="setPrenomPlaceholder"
            @blur="removePrenomPlaceholder"
          />

          <v-spacer />

          <v-text-field
            v-model="nom"
            class="pa-3 t-input-nom"
            prepend-icon="account_box"
            hint="ex. : Dupont"
            tabindex="0"
            label="Nom"
            :aria-placeholder="nomPlaceholder"
            :placeholder="nomPlaceholder"
            required
            @focus="setNomPlaceholder"
            @blur="removeNomPlaceholder"
          />

          <v-spacer />

          <v-text-field
            v-model="matricule"
            class="pa-3 t-input-matricule"
            prepend-icon="confirmation_number"
            hint="ex. : 0954390439"
            tabindex="0"
            :rules="matriculeRules"
            label="Matricule"
            :aria-placeholder="prenomPlaceholder"
            :placeholder="matriculePlaceholder"
            required
            @focus="setMatriculePlaceholder"
            @blur="removeMatriculePlaceholder"
          />

          <v-spacer />

          <select-departements
            class="pa-3 select-departement  t-select-update-ipcsr-departements"
            :available-departements="availableDepartements"
            :multiple="false"
            :default-departement="departement"
            :menu-props="{ minWidth: 150 }"
            @change-departements="newDep => departement = newDep"
          />

          <v-spacer />

          <v-text-field
            ref="email2"
            v-model="email2"
            class="t-input-ipcsr-email2"
            prepend-icon="email"
            aria-placeholder="jean2@dupont.fr"
            hint="ex. : jean2@dupont.fr"
            tabindex="0"
            :rules="email2Rules"
            label="Adresse courriel secondaire"
            :placeholder="emailPlaceholder"
            width="100"
            @focus="setEmailPlaceholder"
            @blur="removeEmailPlaceholder"
            @input="setEmail2ToLowerCase"
          />

          <v-spacer />

          <div class="mt-2">
            <v-btn
              class="t-btn-cancel-update"
              color="#CD1338"
              tabindex="0"
              outlined
              @click="close"
            >
              Annuler
            </v-btn>

            <v-btn
              class="t-btn-update-ipcsr-confirm"
              color="primary"
              :disabled="isUpdatingIpcsr || !valid"
              :aria-disabled="isUpdatingIpcsr || !valid"
              @click="updateIpcsr"
            >
              Modifier
            </v-btn>
          </div>
        </v-container>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState } from 'vuex'

import {
  email as emailRegex,
  matricule as matriculeRegex,
} from '@/util'

import { UPDATE_IPCSR_REQUEST, FETCH_IPCSR_LIST_REQUEST, SHOW_ERROR, FETCH_DEPARTEMENTS_BY_ADMIN_REQUEST } from '@/store'

import SelectDepartements from '../SelectDepartements'

export default {
  components: {
    SelectDepartements,
  },

  props: {
    defaultDepartement: {
      type: String,
      default: '',
    },
    defaultEmail: {
      type: String,
      default: '',
    },
    defaultEmail2: {
      type: String,
      default: '',
    },

    defaultMatricule: {
      type: String,
      default: '',
    },
    defaultNom: {
      type: String,
      default: '',
    },
    defaultPrenom: {
      type: String,
      default: '',
    },
    ipcsrId: {
      type: String,
      default: '',
    },
  },

  data () {
    return {
      updating: false,
      departement: this.defaultDepartement,
      email: this.defaultEmail,
      emailRules: [
        email => !!email || 'Veuillez renseigner votre adresse courriel',
        email => emailRegex.test(email) || "L'adresse courriel doit être valide",
      ],
      emailPlaceholder: '',
      email2: this.defaultEmail2,
      email2Rules: [
        email => !email || emailRegex.test(email) || "L'adresse courriel doit être valide",
      ],

      status: 'repartiteur',
      matricule: this.defaultMatricule,
      matriculePlaceholder: '',
      matriculeRules: [
        matricule => !!matricule || 'Veuillez renseigner un matricule',
        matricule => matriculeRegex.test(matricule) || 'Veuillez renseigner un matricule valide',
      ],
      nom: this.defaultNom,
      nomPlaceholder: '',
      nomRules: [
        nom => !!nom || 'Veuillez renseigner un nom',
      ],
      prenom: this.defaultPrenom,
      prenomPlaceholder: '',
      prenomRules: [
        prenom => !!prenom || 'Veuillez renseigner un prénom',
      ],
      valid: false,
    }
  },

  computed: {
    ...mapState({
      availableDepartements: state => {
        return state.adminDepartements.list.map(dptInfos => dptInfos._id)
      },
      isUpdatingIpcsr: state => state.admin.inspecteurs.isFetching,
    }),

    isUpdatingUser () {
      return this.$store.state.users.isUpdating || false
    },
  },

  mounted () {
    this.$store.dispatch(FETCH_DEPARTEMENTS_BY_ADMIN_REQUEST)
  },

  methods: {
    removeEmailPlaceholder () {
      this.emailPlaceholder = ''
    },
    setEmailPlaceholder () {
      this.emailPlaceholder = 'admin@example.com'
    },
    setEmailToLowerCase () {
      this.email = this.email && this.email.toLowerCase()
    },
    setEmail2ToLowerCase () {
      this.email2 = this.email2 && this.email2.toLowerCase()
    },

    setMatriculePlaceholder () {
      this.matriculePlaceholder = '038448502534'
    },
    removeMatriculePlaceholder () {
      this.matriculePlaceholder = ''
    },

    setPrenomPlaceholder () {
      this.prenomPlaceholder = 'Jean'
    },
    removePrenomPlaceholder () {
      this.prenomPlaceholder = ''
    },

    setNomPlaceholder () {
      this.nomPlaceholder = 'Dupont'
    },
    removeNomPlaceholder () {
      this.nomPlaceholder = ''
    },

    async updateIpcsr () {
      const {
        departement,
        email,
        ipcsrId,
        matricule,
        nom,
        prenom,
        email2,
      } = this

      try {
        await this.$store.dispatch(UPDATE_IPCSR_REQUEST, {
          ipcsrId,
          departement,
          email,
          matricule,
          nom,
          prenom,
          email2: email2 || undefined,
        })

        this.$store.dispatch(FETCH_IPCSR_LIST_REQUEST)
        this.updating = false
      } catch (error) {
        this.$store.dispatch(SHOW_ERROR, error.message)
      }
    },

    close () {
      this.resetForm()
      this.updating = false
    },

    resetForm () {
      this.departement = this.defaultDepartement
      this.email = this.defaultEmail
      this.matricule = this.defaultMatricule
      this.nom = this.defaultNom
      this.prenom = this.defaultPrenom
      this.email2 = this.defaultEmail2
    },
  },
}
</script>

<style scoped>
.select-departement {
  flex-basis: 4em;
}
</style>
