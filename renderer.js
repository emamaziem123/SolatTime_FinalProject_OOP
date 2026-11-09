let prayerTimings
let suggestedPrayer = ""
let suggestedActivity = ""
const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

//function to fetch and display the data from the api
function loadPrayerTimes() {
    const today = new Date()         //retrieves current time from the host computer

    document.getElementById("currentDate").textContent = today.toDateString()

    const city = document.getElementById("cityInput").value
    const country = document.getElementById("countryInput").value
    if (city === "" || country === "") {
        document.getElementById("status").textContent = "Please enter both city and country."
        return
    }
    //sets the current date into string to be put into the API link
    const date = String(today.getDate()).padStart(2, "0") + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + today.getFullYear()
    document.getElementById("status").textContent = "Loading prayer times..."

    //retrieve prayer times from the api (AlAdhan)
    fetch(`https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`)
    .then(function(response) {
        if (!response.ok) {
            throw new Error("API request failed.")
        }
        return response.json()
    })
    .then(function(result) {
        if (result.code !== 200 || !result.data || !result.data.timings) {
            throw new Error("No prayer times found.")
        }

        const apiTimings = result.data.timings
        const timings = {
            Imsak: apiTimings.Imsak.slice(0, 5),
            Fajr: apiTimings.Fajr.slice(0, 5),
            Sunrise: apiTimings.Sunrise.slice(0, 5),
            Dhuhr: apiTimings.Dhuhr.slice(0, 5),
            Asr: apiTimings.Asr.slice(0, 5),
            Maghrib: apiTimings.Maghrib.slice(0, 5),
            Isha: apiTimings.Isha.slice(0, 5)
        }

        document.getElementById("imsak").textContent = timings.Imsak
        document.getElementById("fajr").textContent = timings.Fajr
        document.getElementById("sunrise").textContent = timings.Sunrise
        document.getElementById("dhuhr").textContent = timings.Dhuhr
        document.getElementById("asr").textContent = timings.Asr
        document.getElementById("maghrib").textContent = timings.Maghrib
        document.getElementById("isha").textContent = timings.Isha

        updateCountdown(timings)
        updateSuggestion(timings)

        document.getElementById("status").textContent = "Prayer times loaded successfully!"
        document.getElementById("selectedLocation").textContent = `Selected Location: ${city}, ${country}`

        prayerTimings = timings
    })
    .catch(function(error) {
        prayerTimings = 0

        document.getElementById("status").textContent =
            error.message === "No prayer times found."
            ? "No prayer times found for this location. Please check your city and country."
            : "Unable to load prayer times. Please try again."

        console.log(error)
    })
}
loadPrayerTimes()
//to keep the time in the application correct at all times
setInterval(function() {
    if (prayerTimings) {
        updateCountdown(prayerTimings)
        updateSuggestion(prayerTimings)
    }
}, 1000)
//local storage
let reminders = []
try {           //retrieve saved data from local storage
    const savedReminders = JSON.parse(localStorage.getItem("reminders")) || []
    if (Array.isArray(savedReminders)) {
        for (let i = 0; i < savedReminders.length; i++) {  //loops through the saved reminder
           //assigns the data at current position to reminder
            const reminder = savedReminders[i]      

            if (reminder && reminder.text) {
                reminders.push(reminder)    //adds the data to reminders array
            }
        }
    }
} catch (error) {       
    //if array is empty, returns empty array
    reminders = []
}
//save reminders that are created or updated or deleted to local storage
function saveReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders))
}
//display reminders
function readReminders() {
    const sections = document.getElementById("prayerReminderSections")
    sections.innerHTML = ""     //clears the app's contents to avoid duplication
    prayerNames.forEach(function(prayer) {
        //creates new elements to be added later to index.html
        const section = document.createElement("div")
        section.className = "prayerReminderSection"
        const heading = document.createElement("h3")
        heading.textContent = prayer
        const list = document.createElement("ul")
        list.className = "prayerReminderList"
        //sets reminder to zero at first
        let reminderCount = 0
        reminders.forEach(function(reminder, index) {
            if (reminder.prayer === prayer) {
                reminderCount++   //adds the reminder value by one by each loop
                //creates new elements to be added later to index.html
                const li = document.createElement("li")
                li.className = "reminderItem"
                const activityText = document.createElement("span")
                activityText.className = "reminderText"
                activityText.textContent = reminder.text
                //update button appears when a reminder is added to the prayer box
                const updateButton = document.createElement("button")
                updateButton.textContent = "Update"
                updateButton.className = "updateButton"
                updateButton.onclick = function() {
                    editReminders(index, li)
                }
                //delete button appears when a reminder is added to the prayer box 
                const deleteButton = document.createElement("button")
                deleteButton.textContent = "Delete"
                deleteButton.className = "deleteButton"
                deleteButton.onclick = function() {
                    deleteReminders(index)
                }
                //adds the newly created elements to index.html
                li.appendChild(activityText)
                li.appendChild(updateButton)
                li.appendChild(deleteButton)
                list.appendChild(li)
            }
        })
        //sets a placeholder in each prayer box
        if (reminderCount === 0) {
            const li = document.createElement("li")
            li.className = "emptyReminder"
            li.textContent = "No activities added yet."
            list.appendChild(li)
        }
        //adds the newly created elements to index.html
        section.appendChild(heading)
        section.appendChild(list)
        sections.appendChild(section)
    })
}
//create a new own acitvity/reminder
function addReminder() {
    const reminderInput = document.getElementById("reminderInput")
    const reminderPrayer = document.getElementById("reminderPrayer")
    const reminderStatus = document.getElementById("reminderStatus")

    const newReminder = reminderInput.value
    const selectedPrayer = reminderPrayer.value
    //to avoid duplicate of reminder/activity 
    if (newReminder !== "") {
        let alreadyExists = 0
        for (let i = 0; i < reminders.length; i++) {
            if (reminders[i].text === newReminder && reminders[i].prayer === selectedPrayer)  {
                alreadyExists = 1
            }
        }
        if (alreadyExists === 1) {
            reminderStatus.textContent = `This activity already exists under ${selectedPrayer}.`
            return
        }
        //adds the created reminder/acitivity to the list
        reminders.push({text: newReminder, prayer: selectedPrayer})

        saveReminders()
        readReminders()

        reminderInput.value = ""
        reminderStatus.textContent = "Activity added successfully!"
    } else {
        reminderStatus.textContent = "Please enter an activity or reminder."
    }
}
//add given activity to the planner list
function addSuggestedActivity() {
    const suggestionStatus = document.getElementById("suggestionStatus")

    if (suggestedActivity === "" || suggestedPrayer === "") {
        return
    }
//to avoid duplicate of reminder/activity
    let alreadyExists = 0
    for (let i = 0; i < reminders.length; i++) {
        if (reminders[i].text === suggestedActivity && reminders[i].prayer === suggestedPrayer) {
            alreadyExists = 1
        }
    }
    if (alreadyExists === 1) {
        suggestionStatus.textContent = `This activity is already in your ${suggestedPrayer} planner.`
        return
    }
    //adds the created reminder/activity to the list
    reminders.push({text: suggestedActivity, prayer: suggestedPrayer})

    saveReminders()
    readReminders()

    suggestionStatus.textContent = `Activity added to your ${suggestedPrayer} planner!`
}
//update existing reminder or activity
function editReminders(index, li) {
    const currentReminder = reminders[index]
    //creates new elements to be added to index.html
    const input = document.createElement("input")
    input.type = "text"
    input.value = currentReminder.text
    input.className = "editReminderInput"
    const prayerSelect = document.createElement("select")
    prayerSelect.className = "editPrayerSelect"
    //creates prayer options for the updated reminder/activity
    prayerNames.forEach(function(prayer) {
        const option = document.createElement("option")
        option.value = prayer
        option.textContent = prayer
        prayerSelect.appendChild(option)
    })
    prayerSelect.value = currentReminder.prayer

    //creates a save function to the edited reminder/activity
    const saveButton = document.createElement("button")
    saveButton.textContent = "Save"
    saveButton.className = "updateButton"
    saveButton.onclick = function() {
        const updatedReminder = input.value
        const updatedPrayer = prayerSelect.value
        const reminderStatus = document.getElementById("reminderStatus")

        if (updatedReminder !== "") {
            let alreadyExists = 0

            for (let i = 0; i < reminders.length; i++) {
                if (i !== index && reminders[i].text === updatedReminder && reminders[i].prayer === updatedPrayer) {
                    alreadyExists = 1
                }
            }
            if (alreadyExists === 1) {
                reminderStatus.textContent = `This activity already exists under ${updatedPrayer}.`
                return
            }
            reminders[index] = {text: updatedReminder, prayer: updatedPrayer}
            saveReminders()
            readReminders()

            reminderStatus.textContent = "Activity updated successfully!"
        } else {
            reminderStatus.textContent = "Input cannot be empty."
        }
    }
    //cancel button to cancel the edited reminder/activity
    const cancelButton = document.createElement("button")
    cancelButton.textContent = "Cancel"
    cancelButton.className = "deleteButton"
    cancelButton.onclick = function() {
        readReminders()
    }
    //adds the newly created element to index.html
    li.innerHTML = ""
    li.className = "reminderItem editing"
    li.appendChild(input)
    li.appendChild(prayerSelect)
    li.appendChild(saveButton)
    li.appendChild(cancelButton)
}
//delete reminder
function deleteReminders(index) {
    reminders.splice(index, 1)

    saveReminders()
    readReminders()
    document.getElementById("reminderStatus").textContent = 
    "Activity deleted successfully!"
}

//countdown function for the next upcoming prayer
function updateCountdown(timings) {
    const today = new Date()     //retrieves the current time from the host laptop
    let nextPrayer = ""
    let nextPrayerTime = ""
    for (let i = 0; i < prayerNames.length; i++) {
        const prayerTime = timings[prayerNames[i]].split(":")
        const prayerDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), Number(prayerTime[0]), Number(prayerTime[1]))
        if (nextPrayerTime === "" && prayerDate > today) {
            nextPrayer = prayerNames[i]
            nextPrayerTime = prayerDate
        }
    }

    if (nextPrayer === "") {
        nextPrayer = "Fajr"
        const fajrTime = timings.Fajr.split(":")
        nextPrayerTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, Number(fajrTime[0]), Number(fajrTime[1]))
    }
    document.getElementById("nextPrayer").textContent = `Next Prayer: ${nextPrayer}`

    let difference = nextPrayerTime - new Date()
    if (difference < 0) {
        difference = 0
    }

    const hrs = Math.floor(difference / (1000 * 60 * 60))
    const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const secs = Math.floor((difference % (1000 * 60)) / 1000)
    const hours = String(hrs).padStart(2, "0")
    const minutes = String(mins).padStart(2, "0")
    const seconds = String(secs).padStart(2, "0")

    document.getElementById("countdown").textContent =`${hours}:${minutes}:${seconds}`
}
//function to display suggested activity for upcoming prayer
function updateSuggestion(timings) {
    const today = new Date()    //retrieves the current time from the host laptop
    const currentTime = today.getHours() * 60 + today.getMinutes()
    let nextPrayer = ""

    for (let i = 0; i < prayerNames.length; i++) {
        const prayerTime = timings[prayerNames[i]].split(":")
        const prayerMinutes = Number(prayerTime[0]) * 60 + Number(prayerTime[1])

        if (nextPrayer === "" && prayerMinutes > currentTime) {
            nextPrayer = prayerNames[i]
        }
    }
    if (nextPrayer === "") {
        nextPrayer = "Fajr"
    }
    const previousSuggestion = suggestedActivity
    suggestedPrayer = nextPrayer
    if (nextPrayer === "Fajr") {
        suggestedActivity = "Wake up early for Fajr, and read 1 juz after finishing Fajr."
    } else if (nextPrayer === "Dhuhr") {
        suggestedActivity = "Take a short break and prepare for Dhuhr prayer."
    } else if (nextPrayer === "Asr") {
        suggestedActivity = "Prepare for Asr prayer."
    } else if (nextPrayer === "Maghrib") {
        suggestedActivity = "Take a shower and get ready for Maghrib."
    } else if (nextPrayer === "Isha") {
        suggestedActivity = "Read 1 juz before Isha."
    }

    document.getElementById("suggestion").textContent = suggestedActivity
    if (previousSuggestion !== suggestedActivity) {
        document.getElementById("suggestionStatus").textContent = ""
    }
}
//change pages
const firstPage = document.getElementById("firstPage")
const secondPage = document.getElementById("secondPage")

//handles button clicks
document.getElementById("addReminderButton").addEventListener("click", addReminder)

document.getElementById("addSuggestionButton").addEventListener("click", addSuggestedActivity)

document.getElementById("firstPageButton").addEventListener("click", function() {
    firstPage.style.display = "block"
    secondPage.style.display = "none"
    })
document.getElementById("secondPageButton").addEventListener("click", function() {
    firstPage.style.display = "none"
    secondPage.style.display = "block"
    })
document.getElementById("loadLocationButton").addEventListener("click", function() {
    loadPrayerTimes()
    })
