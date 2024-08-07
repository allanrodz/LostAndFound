const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stringSimilarity = require('string-similarity');
admin.initializeApp();

exports.checkItemInquiry = functions.https.onCall(async (data, context) => {
  const { name, club, color, brand, gender, category } = data;

  // Convert relevant fields to lowercase for case-insensitive matching
  const nameLowerCase = name.toLowerCase();
  const colorLowerCase = color ? color.toLowerCase() : null;
  const genderLowerCase = gender ? gender.toLowerCase() : null;

  // Query all items that match the club
  const querySnapshot = await admin.firestore().collection('items')
    .where('club', '==', club)
    .get();

  let bestMatch = null;
  let highestScore = 0;

  // Define weights for each field
  const weights = {
    name: 0.6,
    color: 0.25,
    gender: 0.15,
  };

  // Iterate over each item and calculate a matching score
  querySnapshot.forEach(doc => {
    const item = doc.data();
    let score = 0;

    // Name similarity (fuzzy matching)
    if (item.name) {
      const nameSimilarity = stringSimilarity.compareTwoStrings(item.name.toLowerCase(), nameLowerCase);
      score += nameSimilarity * weights.name;
    }

    // Exact matches for other fields
    if (item.color && item.color.toLowerCase() === colorLowerCase) score += weights.color;
    if (item.gender && item.gender.toLowerCase() === genderLowerCase) score += weights.gender;

    // Track the best match based on the highest score
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  });

  // Define a threshold for considering a match (e.g., 0.6 or 60% similarity)
  const threshold = 0.6;

  if (bestMatch && highestScore >= threshold) {
    // Return a success message with the best matching item
    return { match: true, item: bestMatch, score: highestScore };
  } else {
    // Return a message indicating no matches were found
    return { match: false, score: highestScore };
  }
});