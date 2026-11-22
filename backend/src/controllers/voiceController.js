const { speechToText, textToSpeech } = require('../services/sarvamService');
const { parseVoiceIntent } = require('../services/intentService');
const {
  findNearbyChargers,
  getChargers,
  getDriverBookings,
  createBooking,
  updateBookingStatus,
  logVoiceCommand
} = require('../services/dataService');

// @desc Process voice command (Audio or Text)
// @route POST /api/voice/process
exports.processVoiceCommand = async (req, res) => {
  try {
    let transcript = req.body.text || '';
    let languageCode = 'en-IN';
    const userLat = Number(req.body.lat) || 13.0827; // Default Chennai center
    const userLng = Number(req.body.lng) || 80.2707;

    // 1. If audio file was uploaded, pass to Sarvam Saaras STT
    if (req.file) {
      const sttResult = await speechToText(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      if (sttResult.transcript) {
        transcript = sttResult.transcript;
        languageCode = sttResult.language_code || 'en-IN';
      } else if (!transcript) {
        // Fallback transcript passed in body if microphone preview transcribed locally
        transcript = req.body.clientTranscript || 'Enakku nearby charging station thedu';
      }
    }

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'No voice audio or text provided'
      });
    }

    // 2. Parse Intent and Language
    const parsed = parseVoiceIntent(transcript);
    languageCode = parsed.language || languageCode;
    const isTamil = languageCode === 'ta-IN';

    let actionResult = null;
    let responseText = '';
    let success = true;

    // 3. Execute appropriate backend application operation
    switch (parsed.intent) {
      case 'FIND_FREE': {
        const chargers = await findNearbyChargers(userLng, userLat, 30, { isFree: true });
        actionResult = { chargers, count: chargers.length };

        if (chargers.length > 0) {
          const top = chargers[0];
          responseText = isTamil
            ? `இலவச சார்ஜர் கிடைத்தது! ${top.name}, ${top.address}-ல் உள்ளது. தூரம் ${top.distanceKm} km.`
            : `Found ${chargers.length} free community charger(s). The closest is ${top.name} at ${top.address}, ${top.distanceKm} km away.`;
        } else {
          responseText = isTamil
            ? 'மன்னிக்கவும், தற்போது அருகில் இலவச சார்ஜர்கள் எதுவும் கிடைக்கவில்லை.'
            : 'No free charging stations were found nearby at this moment.';
        }
        break;
      }

      case 'FIND_CHEAPEST': {
        const chargers = await findNearbyChargers(userLng, userLat, 35);
        // Sort by lowest price per kWh
        const sorted = chargers.sort((a, b) => {
          const priceA = a.isFree ? 0 : (a.pricing?.pricePerKwh ?? 15);
          const priceB = b.isFree ? 0 : (b.pricing?.pricePerKwh ?? 15);
          return priceA - priceB;
        });
        actionResult = { chargers: sorted, count: sorted.length };

        if (sorted.length > 0) {
          const top = sorted[0];
          const priceLabel = top.isFree ? 'இலவசம்' : `₹${top.pricing?.pricePerKwh}/kWh`;
          responseText = isTamil
            ? `மிக குறைந்த கட்டண சார்ஜர்: ${top.name}, ${top.address}. கட்டணம்: ${priceLabel}.`
            : `The most affordable charger is ${top.name} in ${top.address} at ${top.isFree ? 'Free' : `₹${top.pricing?.pricePerKwh}/kWh`}.`;
        } else {
          responseText = isTamil
            ? 'சார்ஜர்கள் எதுவும் கிடைக்கவில்லை.'
            : 'No charging stations found nearby.';
        }
        break;
      }

      case 'SHOW_BOOKINGS': {
        if (!req.user) {
          responseText = isTamil ? 'உங்கள் புக்கிங்குகளை பார்க்க உள்நுழையவும்.' : 'Please log in to view your bookings.';
          success = false;
          break;
        }
        const bookings = await getDriverBookings(req.user._id);
        const active = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
        actionResult = { bookings: active, count: active.length };

        if (active.length > 0) {
          const first = active[0];
          const chargerName = first.charger?.name || 'Home Charger';
          responseText = isTamil
            ? `உங்களிடம் ${active.length} முன்பதிவு உள்ளது. அடுத்த முன்பதிவு: ${chargerName}, தேதி ${first.date}, நேரம் ${first.startTime}.`
            : `You have ${active.length} active reservation(s). Next stop is at ${chargerName} on ${first.date} at ${first.startTime}.`;
        } else {
          responseText = isTamil
            ? 'தற்போது உங்களுக்கு எந்தவொரு முன்பதிவும் இல்லை.'
            : 'You currently have no active charging reservations.';
        }
        break;
      }

      case 'CANCEL_BOOKING': {
        if (!req.user) {
          responseText = isTamil ? 'புக்கிங்கை ரத்து செய்ய உள்நுழையவும்.' : 'Please log in to cancel a booking.';
          success = false;
          break;
        }
        const bookings = await getDriverBookings(req.user._id);
        const active = bookings.find((b) => b.status === 'confirmed' || b.status === 'pending');

        if (active) {
          const cancelled = await updateBookingStatus(active._id, 'cancelled', 'Cancelled via Voice Assistant');
          actionResult = { cancelledBooking: cancelled };
          responseText = isTamil
            ? `உங்கள் ${active.charger?.name || 'சார்ஜர்'} முன்பதிவு வெற்றிகரமாக ரத்து செய்யப்பட்டது.`
            : `Your booking for ${active.charger?.name || 'charger'} on ${active.date} has been cancelled successfully.`;
        } else {
          responseText = isTamil
            ? 'ரத்து செய்வதற்கு எந்தவொரு செயலில் உள்ள முன்பதிவும் இல்லை.'
            : 'No active booking was found to cancel.';
        }
        break;
      }

      case 'BOOK_CHARGER': {
        if (!req.user) {
          responseText = isTamil ? 'சார்ஜர் புக் செய்ய தயவுசெய்து உள்நுழையவும்.' : 'Please log in to book a charger.';
          success = false;
          break;
        }

        const chargers = await findNearbyChargers(userLng, userLat, 20);
        if (chargers.length === 0) {
          responseText = isTamil ? 'புக் செய்ய அருகில் சார்ஜர்கள் இல்லை.' : 'No available chargers found to book.';
          break;
        }

        const targetCharger = chargers[0];
        const dateStr = new Date().toISOString().split('T')[0];
        const slotStart = parsed.parameters.time || '18:00';
        const [h, m] = slotStart.split(':').map(Number);
        const slotEnd = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        try {
          const booking = await createBooking({
            driver: req.user._id,
            charger: targetCharger._id,
            owner: targetCharger.owner?._id || targetCharger.owner,
            date: dateStr,
            startTime: slotStart,
            endTime: slotEnd,
            durationHours: 1,
            totalAmount: targetCharger.isFree ? 0 : (targetCharger.pricing?.pricePerHour || 40),
            isFree: Boolean(targetCharger.isFree),
            status: 'confirmed'
          });

          actionResult = { booking, charger: targetCharger };
          responseText = isTamil
            ? `${targetCharger.name}-ல் இன்று ${slotStart} மணிக்கு முன்பதிவு உறுதி செய்யப்பட்டது! கட்டணம்: ₹${booking.totalAmount}.`
            : `Booking confirmed at ${targetCharger.name} for today from ${slotStart} to ${slotEnd}. Total: ₹${booking.totalAmount}.`;
        } catch (bookingErr) {
          responseText = isTamil
            ? `முன்பதிவு செய்ய முடியவில்லை: ${bookingErr.message}`
            : `Could not complete booking: ${bookingErr.message}`;
          success = false;
        }
        break;
      }

      case 'NAVIGATE':
      case 'FIND_ROUTE':
      case 'FIND_NEARBY':
      default: {
        const filters = {};
        if (parsed.parameters.connectorType) filters.connectorType = parsed.parameters.connectorType;
        if (parsed.parameters.acDcType) filters.acDcType = parsed.parameters.acDcType;

        const chargers = await findNearbyChargers(userLng, userLat, 30, filters);
        actionResult = { chargers, count: chargers.length };

        if (chargers.length > 0) {
          const closest = chargers[0];
          responseText = isTamil
            ? `உங்களுக்கு அருகில் ${chargers.length} சார்ஜர்கள் கண்டறியப்பட்டன. மிக அருகில் இருப்பது ${closest.name}, ${closest.address} (${closest.distanceKm} km).`
            : `Found ${chargers.length} charging stations nearby. The closest is ${closest.name} at ${closest.address}, located ${closest.distanceKm} km away.`;
        } else {
          responseText = isTamil
            ? 'உங்கள் பகுதிக்கு அருகில் சார்ஜர்கள் எதுவும் கண்டறியப்படவில்லை.'
            : 'No charging stations were found in your immediate vicinity.';
        }
        break;
      }
    }

    // 4. Log the command for audit and safety
    try {
      await logVoiceCommand({
        user: req.user?._id || null,
        transcript,
        language: languageCode,
        intent: parsed.intent,
        parameters: parsed.parameters,
        success,
        responseText
      });
    } catch (logErr) {
      console.warn('[VoiceLog Notice]', logErr.message);
    }

    // 5. Convert response to speech via Sarvam Bulbul TTS
    const ttsResult = await textToSpeech(responseText, languageCode);

    res.json({
      success: true,
      transcript,
      language: languageCode,
      intent: parsed.intent,
      parameters: parsed.parameters,
      responseText,
      audioBase64: ttsResult.audioBase64,
      actionResult
    });
  } catch (err) {
    console.error('[VoiceController Error]', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Voice assistant processing error'
    });
  }
};
