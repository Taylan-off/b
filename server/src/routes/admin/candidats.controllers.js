import { appLogger } from '../../util/logger'
import {
  synchroAurige,
  getCandidatsAsCsv,
  getBookedCandidatsAsCsv,
} from './business'
import {
  findAllCandidatsLean,
  findBookedCandidats,
  findCandidatsMatching,
  findCandidatById,
} from '../../models/candidat'
import { findPlaceByCandidatId } from '../../models/place'
import { statutReasonDictionnary } from '../common/reason.constants'
import { UNKNOW_EROOR_GET_CANDIDAT } from './message.constants'

export const importCandidats = async (req, res) => {
  const loggerInfo = {
    section: 'admin-import-candidats',
    user: req.userId,
  }
  const files = req.files

  if (!files || !files.file) {
    res.status(400).json({
      success: false,
      message: 'Fichier manquant',
    })
    return
  }

  const jsonFile = files.file

  try {
    loggerInfo.filename = jsonFile.name
    appLogger.info({ ...loggerInfo })

    const result = await synchroAurige(jsonFile.data)
    res.status(200).send({
      fileName: jsonFile.name,
      success: true,
      message: `Le fichier ${jsonFile.name} a été synchronisé.`,
      candidats: result,
    })
  } catch (error) {
    appLogger.error({ ...loggerInfo, error })
    return res.status(500).send({
      success: false,
      message: error.message,
      error,
    })
  }
}

export const exportCandidats = async (req, res) => {
  appLogger.info({
    section: 'admin-export-cvs',
    action: 'candidats',
    user: req.userId,
  })

  const candidatsAsCsv = await getCandidatsAsCsv(req.candidats)
  const filename = 'candidatsLibresPrintel.csv'
  res
    .status(200)
    .attachment(filename)
    .send(candidatsAsCsv)
}

export const exportBookedCandidats = async (req, res) => {
  appLogger.info({
    section: 'admin-export-cvs',
    action: 'booked-candidats',
    user: req.userId,
  })

  const candidatsAsCsv = await getBookedCandidatsAsCsv(req.candidats)
  const filename = 'candidatsLibresReserve.csv'
  res
    .status(200)
    .attachment(filename)
    .send(candidatsAsCsv)
}

export const getCandidats = async (req, res) => {
  const section = 'admin-get-candidats'
  const loggerInfo = {
    section,
    user: req.userId,
  }
  const { id: candidatId } = req.params
  try {
    if (candidatId) {
      loggerInfo.action = 'INFO-CANDIDAT'
      loggerInfo.candidatId = candidatId
      appLogger.info(loggerInfo)

      const candidatFound = await findCandidatById(candidatId)

      if (candidatFound) {
        const placeFound = await findPlaceByCandidatId(candidatId, true)
        const candidat = candidatFound.toObject()
        candidat.places =
          candidat.places &&
          candidat.places.map(place => {
            const humanReadableReason =
              statutReasonDictionnary[place.archiveReason]
            return {
              ...place,
              archiveReason: humanReadableReason,
            }
          })
        res.json({
          success: true,
          candidat: { ...candidat, place: placeFound },
        })
        return
      }
      res.json({ success: false, message: "Le candidat n'existe pas" })
      return
    }

    const { matching, format, filter, for: actionAsk } = req.query

    if (matching) {
      loggerInfo.action = 'SEARCH-CANDIDAT'
      loggerInfo.matching = matching
      appLogger.info(loggerInfo)

      const candidats = await findCandidatsMatching(matching)
      res.json(candidats)
      return
    }

    if (filter === 'resa') {
      loggerInfo.action = 'INFO-RESA'
      loggerInfo.filter = filter
      loggerInfo.format = format
      appLogger.info(loggerInfo)

      getBookedCandidats(req, res)
      return
    }

    loggerInfo.action = 'INFO-CANDIDATS'
    loggerInfo.filter = filter
    loggerInfo.format = format
    appLogger.info(loggerInfo)

    const candidatsLean = await findAllCandidatsLean()
    appLogger.debug({ ...loggerInfo, candidatsLean })
    let candidats
    if (actionAsk === 'aurige') {
      candidats = candidatsLean
    } else {
      candidats = await Promise.all(
        candidatsLean.map(async candidat => {
          const { _id } = candidat
          const places = await findPlaceByCandidatId(_id)
          if (places.length > 1) {
            appLogger.warn({
              ...loggerInfo,
              candidatId: _id,
              description: `Le candidat ${candidat.codeNeph} / '${candidat.nomNaissance} a plusieurs places d'examens`,
            })
          }
          candidat.place = places[0] || {}
          return candidat
        })
      )
    }
    if (format && format === 'csv') {
      req.candidats = candidats
      exportCandidats(req, res)
      return
    }
    res.json(candidats)
  } catch (error) {
    appLogger.error({
      ...loggerInfo,
      description: UNKNOW_EROOR_GET_CANDIDAT,
      error,
    })
    return res.status(500).send({
      success: false,
      message: UNKNOW_EROOR_GET_CANDIDAT,
      error,
    })
  }
}

export const getBookedCandidats = async (req, res) => {
  const {
    query: { format, date, inspecteur, centre },
  } = req

  appLogger.info({
    section: 'admin-get-booked-candidats',
    user: req.userId,
    format,
    date,
    inspecteur,
    centre,
  })

  const candidats = await findBookedCandidats(date, inspecteur, centre)

  if (format && format === 'csv') {
    req.candidats = candidats
    exportBookedCandidats(req, res)
    return
  }
  res.json(candidats)
}
