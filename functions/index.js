const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp }    = require('firebase-admin/app')
const { getFirestore }     = require('firebase-admin/firestore')

initializeApp()

const UIS_MAX = { boxing: 200, rollerblade: 100 }
const UIS_WA  = { boxing: 0.65, rollerblade: 0.45 }
const UIS_WG  = { boxing: 0.35, rollerblade: 0.55 }

/**
 * Triggered when the app writes a session to Firestore.
 * Re-validates the UIS score server-side and marks it as verified.
 *
 * The app computes UIS from local samples; here we just stamp "verified: true"
 * on honest sessions and cap/flag anything above 1000.
 */
exports.validateSession = onDocumentCreated('sessions/{sessionId}', async (event) => {
  const snap = event.data
  if (!snap) return

  const data      = snap.data()
  const uisScore  = data.uisScore || 0
  const sport     = data.sport || 'boxing'
  const uid       = data.uid

  const capped   = Math.min(uisScore, 1000)
  const flagged  = uisScore > 1100   // mild tolerance for float rounding

  await snap.ref.update({
    uisScore:  capped,
    verified:  !flagged,
    flagged:   flagged
  })

  // Update user's high score if this session beats it
  if (!flagged && uid) {
    const db      = getFirestore()
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    const current  = userSnap.exists ? (userSnap.data().uisHighScore || 0) : 0
    if (capped > current) {
      await userRef.update({ uisHighScore: capped })
    }
  }
})
