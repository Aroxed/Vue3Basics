(function(settings) {
    console.log('Tracker script starting...');
    
    // Use a more robust initialization check
    const INIT_KEY = 'tracker_initialized_' + window.location.origin;
    const API_KEY = settings['API_KEY']
    if (!!!API_KEY) {
      console.error("No API_KEY provided. The script cannot start.")
      return;
    }
    const SESSION_KEY = 'tracker_session_id';
    const BATCH_INTERVAL = 5000;  // Send events every 5 seconds
    const MAX_BATCH_SIZE = 100;   // Maximum number of events per batch

    // Configuration
    const TRACKER_URL = 'http://localhost'
    //const TRACKER_URL = 'https://app.productpathpro.com';  // Use correct port
    let sessionId = null;
    let events = [];
    let stopFn = null;
    let batchTimeout = null;
    let currentBatch = [];
    let isUnloading = false;
    let isRecording = false;
    let originalUrl = window.location.origin;
    let recorder = null;

    // Check if we're already initialized for this origin
    if (localStorage.getItem(INIT_KEY)) {
        console.log('Tracker already initialized for this origin, skipping reinitialization');
        // If we have a session ID, just restore the recording
        if (sessionId) {
            console.log('Restoring recording with existing session ID:', sessionId);
            // Load rrweb if not already loaded
            if (!document.querySelector('script[src*="rrweb.min.js"]')) {
                console.log('Loading rrweb script...');
                const script = document.createElement('script');
                script.src = `${TRACKER_URL}/static/tracker/rrweb.min.js`;
                script.onload = () => {
                    console.log('rrweb script loaded, checking availability...');
                    if (typeof rrweb !== 'undefined') {
                        console.log('rrweb is available, starting recording...');
                        startRecording();
                    } else {
                        console.error('rrweb not available after script load');
                    }
                };
                script.onerror = (error) => {
                    console.error('Error loading rrweb script:', error);
                };
                document.head.appendChild(script);
            } else if (typeof rrweb !== 'undefined') {
                console.log('rrweb already loaded and available, starting recording...');
                startRecording();
            } else {
                console.error('rrweb script loaded but rrweb not available');
            }
        } else {
            console.log('No session ID found, starting new session...');
            // Load rrweb if not already loaded
            if (!document.querySelector('script[src*="rrweb.min.js"]')) {
                console.log('Loading rrweb script...');
                const script = document.createElement('script');
                script.src = `${TRACKER_URL}/static/tracker/rrweb.min.js`;
                script.onload = () => {
                    console.log('rrweb script loaded, checking availability...');
                    if (typeof rrweb !== 'undefined') {
                        console.log('rrweb is available, starting recording...');
                        startRecording();
                    } else {
                        console.error('rrweb not available after script load');
                    }
                };
                script.onerror = (error) => {
                    console.error('Error loading rrweb script:', error);
                };
                document.head.appendChild(script);
            } else if (typeof rrweb !== 'undefined') {
                console.log('rrweb already loaded and available, starting recording...');
                startRecording();
            } else {
                console.error('rrweb script loaded but rrweb not available');
            }
        }
        return;
    }

    // Mark this origin as initialized BEFORE loading rrweb
    console.log('Marking origin as initialized:', window.location.origin);
    localStorage.setItem(INIT_KEY, 'true');

    // Load rrweb if not already loaded
    if (!document.querySelector('script[src*="rrweb.min.js"]')) {
        console.log('Loading rrweb script...');
        const script = document.createElement('script');
        script.src = `${TRACKER_URL}/static/tracker/rrweb.min.js`;
        script.onload = () => {
            console.log('rrweb script loaded, checking availability...');
            if (typeof rrweb !== 'undefined') {
                console.log('rrweb is available, starting recording...');
                startRecording();
            } else {
                console.error('rrweb not available after script load');
            }
        };
        script.onerror = (error) => {
            console.error('Error loading rrweb script:', error);
        };
        document.head.appendChild(script);
    } else if (typeof rrweb !== 'undefined') {
        console.log('rrweb already loaded and available, starting recording...');
        startRecording();
    } else {
        console.error('rrweb script loaded but rrweb not available');
    }

    function sanitizeEvent(event) {
        try {
            // Convert boolean values to strings and handle None before stringifying
            const processedEvent = JSON.parse(JSON.stringify(event, (key, value) => {
                if (typeof value === 'boolean') {
                    return value.toString();
                }
                if (value === null) {
                    return 'null';
                }
                return value;
            }));
            return processedEvent;
        } catch (error) {
            console.error('Error sanitizing event:', error);
            return {
                type: 'custom',
                data: { error: 'Event sanitization failed' }
            };
        }
    }

    function updateSessionId(newSessionId) {
        if (newSessionId) {
            sessionId = newSessionId;
            localStorage.setItem(SESSION_KEY, newSessionId);
            console.log('Session ID updated and stored:', newSessionId);
        }
    }

    function scheduleBatchSend() {
        if (batchTimeout) {
            clearTimeout(batchTimeout);
        }
        batchTimeout = setTimeout(sendBatch, BATCH_INTERVAL);
    }

    function sendBatch(events, isFinalBatch = false) {
        if (!events || !events.length) return;

        const batchSize = events.length;
        const batchTimestamp = new Date().toISOString();
        
        // Always get current page URL and title
        const pageUrl = window.location.href;
        const pageTitle = document.title || pageUrl;  // Use URL as title if no title

        // Prepare batch data
        const batchData = {
            type: 'batch',
            events: events,
            batch_size: batchSize,
            batch_timestamp: batchTimestamp,
            is_final_batch: isFinalBatch,
            page_url: pageUrl,
            page_title: pageTitle
        };

        // Send batch to server
        fetch(`${TRACKER_URL}/tracker/api/record-event/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: API_KEY,
                session_id: getSessionId(),  // Get current session ID
                event_data: batchData,
                page_url: pageUrl,
                page_title: pageTitle
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.session_id) {
                // Update session ID if we got a new one
                saveSessionId(data.session_id);
            }
            console.log(`Processed batch of ${batchSize} events`);
        })
        .catch(error => {
            console.error('Error sending batch:', error);
        });
    }

    function addEvent(event) {
        // Sanitize the event before storing
        const sanitizedEvent = sanitizeEvent(event);
        events.push(sanitizedEvent);
        currentBatch.push(sanitizedEvent);
        
        // Send batch if it reaches max size
        if (currentBatch.length >= MAX_BATCH_SIZE) {
            sendBatch([...currentBatch]);
            currentBatch = [];
        }
    }

    function sendFinalBatch() {
        if (currentBatch.length === 0) return;

        try {
            // Get current page info
            const pageUrl = window.location.href;
            const pageTitle = document.title;

            // Only add session end event if we're actually unloading
            if (isUnloading) {
                currentBatch.push({
                    type: 'session_end',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Use sendBeacon for more reliable delivery during page unload
            const url = `${TRACKER_URL}/tracker/api/record-event/${sessionId ? `?session_id=${sessionId}` : ''}`;
            console.log('Sending batch with session ID:', sessionId, 'URL:', url);
            
            const blob = new Blob([JSON.stringify({
                event_data: {
                    type: 'batch',
                    events: currentBatch,
                    batch_size: currentBatch.length,
                    batch_timestamp: new Date().toISOString(),
                    is_final_batch: isUnloading,
                    url: pageUrl
                },
                page_url: pageUrl,
                page_title: pageTitle
            })], { type: 'application/json' });

            // Try fetch first, then fallback to sendBeacon
            if (!isUnloading) {
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    credentials: 'omit',
                    body: JSON.stringify({
                        event_data: {
                            type: 'batch',
                            events: currentBatch,
                            batch_size: currentBatch.length,
                            batch_timestamp: new Date().toISOString(),
                            is_final_batch: false
                        },
                        page_url: pageUrl,
                        page_title: pageTitle,
                        api_key: API_KEY
                    })
                }).catch(error => {
                    console.error('Error sending batch with fetch:', error);
                    // Only try sendBeacon if fetch fails
                    const beaconSent = navigator.sendBeacon(url, blob);
                    console.log('Beacon sent:', beaconSent);
                });
            } else {
                // Only use sendBeacon during page unload
                const beaconSent = navigator.sendBeacon(url, blob);
                console.log('Beacon sent:', beaconSent);
            }
        } catch (error) {
            console.error('Error sending batch:', error);
        }
    }

    function startRecording() {
        if (isRecording) return;
        
        // Initialize session first
        initializeSession();
        
        // Initialize rrweb
        stopFn = rrweb.record({
            emit(event) {
                currentBatch.push(event);
                console.log(event)
                // Send batch if it reaches max size
                if (currentBatch.length >= MAX_BATCH_SIZE) {
                    sendBatch([...currentBatch]);
                    currentBatch = [];
                }
            },
            inlineStylesheet: true,
            sampling: {
                // Configure which kinds of mouse interaction should be recorded
                mouseInteraction: {
                  MouseUp: false,
                  MouseDown: false,
                  Click: true,
                  ContextMenu: false,
                  DblClick: true,
                  Focus: false,
                  Blur: false,
                  TouchStart: false,
                  TouchEnd: false,
                },
              },
            });

        // Start recording
        isRecording = true;
        console.log('Started recording with session ID:', getSessionId());

        // Set up periodic batch sending
        setInterval(() => {
            if (currentBatch.length > 0) {
                sendBatch([...currentBatch]);
                currentBatch = [];
            }
        }, BATCH_INTERVAL);

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Page is being hidden (user is leaving or switching tabs)
                if (currentBatch.length > 0) {
                    console.log('Page hidden, sending final batch');
                    sendBatch([...currentBatch], true);
                    currentBatch = [];
                }
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (currentBatch.length > 0) {
                console.log('Page unloading, sending final batch');
                sendBatch([...currentBatch], true);
            }
        });
    }

    // Function to get session ID from URL
    function getSessionIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('session_id');
    }

    // Function to get or create session ID
    function getSessionId() {
        // Try localStorage first
        let id = localStorage.getItem(SESSION_KEY);
        if (id) {
            sessionId = id;
            return id;
        }

        // Then try URL (for backward compatibility)
        id = getSessionIdFromUrl();
        if (id) {
            sessionId = id;
            localStorage.setItem(SESSION_KEY, id);
            return id;
        }

        return null;
    }

    // Function to save session ID
    function saveSessionId(id) {
        sessionId = id;
        localStorage.setItem(SESSION_KEY, id);
    }

    // Function to initialize session
    function initializeSession() {
        const existingId = getSessionId();
        if (!existingId) {
            // Send initial request to get session ID
            fetch(`${TRACKER_URL}/tracker/api/record-event/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_data: {
                        type: 'session_start',
                        timestamp: new Date().toISOString()
                    },
                    page_url: window.location.href,
                    page_title: document.title,
                    api_key: API_KEY
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.session_id) {
                    saveSessionId(data.session_id);
                    console.log('Initialized session:', data.session_id);
                }
            })
            .catch(error => {
                console.error('Error initializing session:', error);
            });
        } else {
            console.log('Using existing session:', existingId);
        }
    }
})({"API_KEY": "10CADB392481E82D"});