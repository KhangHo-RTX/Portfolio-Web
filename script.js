/**
 * API: https://api.lanyard.rest/v1/users/{user_id} để lấy rpc discord
 * API: https://dcdn.dstn.to/profile/{user_id} để lấy profile cơ bản
 * API: https://discord.com/api/v9/invites/{invite_code}?with_counts=true&with_expiration=true để lấy thông tin server discord
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoadingScreen();
});

function initApp() {
    initNavigation();
    initPageTransitions();
    initScrollReveal();
    initSkillBars();
    initCountUp();
    initMusicPlayer();
    initDiscordProfile();
    initExperienceCards();
    initBgToggle();
}

function initLoadingScreen() {
    const overlay = document.getElementById('loading-overlay');
    const enterBtn = document.getElementById('loading-enter-btn');

    if (!overlay) { initApp(); return; }

    fetchDiscordProfileForLoading().catch(() => {});

    enterBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        document.body.classList.add('loaded');
        initApp();
        setTimeout(() => overlay.remove(), 700);
    });
}

function fetchDiscordProfileForLoading() {
    const USER_ID = '1514899451016249467';
    const LANYARD_API = `https://api.lanyard.rest/v1/users/${USER_ID}`;
    const DCDN_API = `https://dcdn.dstn.to/profile/${USER_ID}`;

    function fetchWithTimeout(url, ms) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal })
            .finally(() => clearTimeout(timer));
    }

    return Promise.allSettled([
        fetchWithTimeout(DCDN_API, 5000).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
        fetchWithTimeout(LANYARD_API, 5000).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    ]).then(([dcdnResult, lanyardResult]) => {
        let profileData = null;
        let lanyardData = null;

        if (dcdnResult.status === 'fulfilled') {
            profileData = adaptDcdnProfile(dcdnResult.value);
        }
        if (lanyardResult.status === 'fulfilled' && lanyardResult.value.success) {
            lanyardData = lanyardResult.value.data;
        }

        if (profileData && lanyardData) {
            profileData.discord_status = lanyardData.discord_status;
            profileData.activities = lanyardData.activities || [];
            profileData.listening_to_spotify = lanyardData.listening_to_spotify;
            profileData.spotify = lanyardData.spotify;
        } else if (lanyardData) {
            profileData = lanyardData;
        }

        if (profileData) {
            updateProfile(profileData);
        }
        return profileData;
    });
}

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const links = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        updateActiveNav();
    });

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        }
    });
}

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';

    sections.forEach(section => {
        const top = section.offsetTop - 120;
        if (window.scrollY >= top) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === current) {
            link.classList.add('active');
        }
    });
}

function initPageTransitions() {
    const transitionOverlay = document.getElementById('page-transition');
    const allAnchors = document.querySelectorAll('a[href^="#"]');

    allAnchors.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (!target) return;
            triggerTransition(transitionOverlay, target);
        });
    });
}

function triggerTransition(overlay, targetSection) {
    overlay.classList.add('active');
    targetSection.classList.remove('section-transitioning');
    void targetSection.offsetWidth;
    targetSection.classList.add('section-transitioning');

    setTimeout(() => {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    setTimeout(() => {
        overlay.classList.remove('active');
    }, 900);

    setTimeout(() => {
        targetSection.classList.remove('section-transitioning');
    }, 1200);
}

function initScrollReveal() {
    const reveals = document.querySelectorAll(
        '.glass-card, .section-header, .skill-bar-item, .contact-grid'
    );

    reveals.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    reveals.forEach(el => observer.observe(el));
}

function initSkillBars() {
    const bars = document.querySelectorAll('.skill-bar-fill');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const width = bar.getAttribute('data-width');
                    bar.style.setProperty('--target-width', width);
                    setTimeout(() => {
                        bar.style.width = width + '%';
                    }, 200);
                    observer.unobserve(bar);
                }
            });
        },
        { threshold: 0.5 }
    );

    bars.forEach(bar => observer.observe(bar));
}

function initCountUp() {
    const counters = document.querySelectorAll('.stat-number');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-count'));
                    animateCount(counter, target);
                    observer.unobserve(counter);
                }
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach(c => observer.observe(c));
}

function animateCount(el, target) {
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * target);
        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target;
        }
    }

    requestAnimationFrame(update);
}

function initMusicPlayer() {
    const player = document.getElementById('music-player');
    if (!player) return;

    const audio = document.getElementById('main-audio');
    const audioToggle = document.getElementById('audio-toggle');
    const tooltipText = document.getElementById('track-tooltip-text');

    const playlist = [
        {
            name: "2 4 W/n",
            artist: "W/n",
            src: "music/24Wn.mp3"
        },
    ];

    let currentTrackIndex = 0;
    let isPlaying = false;

    audio.volume = 0.50;
    audio.muted = true;

    function loadTrack(index) {
        const track = playlist[index];
        audio.src = track.src;
        tooltipText.textContent = `Đang phát: ${track.name} - ${track.artist}`;
    }

    function playTrack() {
        return audio.play().then(() => {
            if (!audio.muted) {
                isPlaying = true;
                player.classList.add('playing');
            }
            return true;
        }).catch(err => {
            console.log("Autoplay failed:", err);
            isPlaying = false;
            player.classList.remove('playing');
            throw err;
        });
    }

    function pauseTrack() {
        isPlaying = false;
        player.classList.remove('playing');
        audio.pause();
    }

    function unmuteAudio() {
        if (audio.muted) {
            audio.muted = false;
            isPlaying = true;
            player.classList.add('playing');
            console.log("Audio unmuted by user interaction.");
        }
    }

    audioToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.muted) {
            unmuteAudio();
            playTrack().catch(() => {});
        } else {
            if (isPlaying) {
                pauseTrack();
            } else {
                playTrack().catch(() => {});
            }
        }
    });

    const handleFirstInteraction = () => {
        unmuteAudio();
        if (audio.paused) {
            playTrack().catch(() => {});
        }
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction);

    audio.addEventListener('ended', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        playTrack().catch(() => {});
    });

    const savedTrack = localStorage.getItem('music_track_index');
    if (savedTrack !== null) {
        currentTrackIndex = parseInt(savedTrack);
        if (currentTrackIndex >= playlist.length) currentTrackIndex = 0;
    }

    window.addEventListener('beforeunload', () => {
        localStorage.setItem('music_track_index', currentTrackIndex);
    });

    loadTrack(currentTrackIndex);
    audio.play().then(() => {
        console.log("Muted autoplay started successfully.");
    }).catch(err => {
        console.log("Muted autoplay blocked or failed:", err);
    });
}

function initDiscordProfile() {
    const USER_ID = '1514899451016249467';
    const LANYARD_API = `https://api.lanyard.rest/v1/users/${USER_ID}`;
    const DCDN_API = `https://dcdn.dstn.to/profile/${USER_ID}`;
    const POLL_INTERVAL = 30000;

    const els = {
        banner: document.getElementById('discord-banner'),
        avatar: document.getElementById('discord-avatar'),
        avatarDecoration: document.getElementById('discord-avatar-decoration'),
        statusDot: document.getElementById('discord-status-dot'),
        displayName: document.getElementById('discord-display-name'),
        username: document.getElementById('discord-username'),
        badges: document.getElementById('discord-badges'),
        activityRpc: document.getElementById('activity-rpc'),
        activitySpotify: document.getElementById('activity-spotify'),
        activityCardGrid: document.getElementById('activity-card-grid'),
        activityStatus: document.getElementById('activity-status'),
        activityCard: document.getElementById('activity-card'),
        bio: document.getElementById('discord-bio'),
        connectedAccounts: document.getElementById('discord-connected-accounts'),
    };

    if (!els.banner) return;

    function getActivityType(type) {
        const types = { 0: 'Đang chơi', 1: 'Đang phát trực tiếp', 2: 'Đang nghe', 3: 'Đang xem', 4: 'Đang chơi', 5: 'Đang cạnh tranh' };
        return types[type] || 'Đang hoạt động';
    }

    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    function adjustColor(hex, amount) {
        hex = hex.replace('#', '');
        const num = parseInt(hex, 16);
        let r = (num >> 16) + amount;
        let g = ((num >> 8) & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    function formatBio(bio) {
        if (!bio) return '';
        let html = bio.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        html = html.replace(/&lt;(a?):([a-zA-Z0-9_]+):([0-9]+)&gt;/g, (match, animated, name, id) => {
            const ext = animated ? 'gif' : 'png';
            return `<img style="width:20px;height:20px;vertical-align:bottom;object-fit:contain;margin:0 2px" src="https://cdn.discordapp.com/emojis/${id}.${ext}?size=44" alt=":${name}:">`;
        });
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    function generateSVGBadge(id, name) {
        const colors = { 'premium': '#ff73fa', 'guild_booster_lvl1': '#ff73fa', 'staff': '#5865f2', 'partner': '#5865f2', 'active_developer': '#23a55a', 'verified_developer': '#5865f2' };
        const color = colors[id] || '#5865f2';
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        return `data:image/svg+xml,${encodeURIComponent(`<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="10" fill="${color}"/><text x="11" y="15" font-size="12" fill="white" text-anchor="middle" font-family="Arial">${initial}</text></svg>`)}`;
    }

    function renderBadges(badges, premium_since, premium_guild_since) {
        els.badges.innerHTML = '';
        const badgeList = [];
        if (badges && badges.length > 0) {
            badges.forEach(b => badgeList.push({ id: b.id, icon: b.icon, name: b.description, link: b.link }));
        }
        if (premium_since && !badges?.find(b => b.id.includes('premium'))) {
            badgeList.push({ id: 'premium', icon: '2ba85e8026a8614b640c2837bcdfe21b', name: 'Nitro subscriber' });
        }
        if (premium_guild_since && !badges?.find(b => b.id === 'guild_booster_lvl1')) {
            badgeList.push({ id: 'guild_booster_lvl1', icon: '51040c70d4f20a921ad6674ff86fc95c', name: 'Server booster' });
        }
        badgeList.forEach(badge => {
            const el = document.createElement('div');
            el.className = 'discord-badge-item';
            el.title = badge.name;
            const img = document.createElement('img');
            img.className = 'discord-badge-img';
            img.src = `https://cdn.discordapp.com/badge-icons/${badge.icon}.png`;
            img.alt = badge.name;
            img.onerror = () => { img.src = generateSVGBadge(badge.id, badge.name); };
            el.appendChild(img);
            els.badges.appendChild(el);
        });
    }

    function renderConnectedAccounts(accounts) {
        els.connectedAccounts.innerHTML = '';
        if (!accounts || accounts.length === 0) {
            els.connectedAccounts.parentElement.style.display = 'none';
            return;
        }
        els.connectedAccounts.parentElement.style.display = 'block';
        els.connectedAccounts.style.display = 'grid';
        const accountIcons = {
            'github': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
            'spotify': `<svg width="16" height="16" viewBox="0 0 24 24" fill="#1db954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
            'youtube': `<svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
            'twitter': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
            'twitch': `<svg width="16" height="16" viewBox="0 0 24 24" fill="#9146ff"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
            'domain': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        };
        const urlMap = {
            'github': a => `https://github.com/${a.name}`,
            'spotify': a => `https://open.spotify.com/user/${a.id}`,
            'youtube': a => `https://youtube.com/@${a.name}`,
            'twitter': a => `https://twitter.com/${a.name}`,
            'twitch': a => `https://twitch.tv/${a.name}`,
        };
        accounts.forEach(account => {
            const el = document.createElement('a');
            el.className = 'discord-connected-account';
            el.href = urlMap[account.type] ? urlMap[account.type](account) : `https://${account.name}`;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
            el.title = `${account.type}: ${account.name}`;
            const icon = accountIcons[account.type] || accountIcons['domain'];
            el.innerHTML = `<span class="discord-account-icon">${icon}<span>${account.name}</span></span>`;
            els.connectedAccounts.appendChild(el);
        });
    }

    let elapsedTimer = null;

    function renderActivities(activities, listening_to_spotify, spotify, discord_status) {
        if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }

        const statusMap = {
            online: { color: '#3ba55d', label: 'Online' },
            idle: { color: '#faa81a', label: 'Idle' },
            dnd: { color: '#ed4245', label: 'Do Not Disturb' },
            offline: { color: '#747f8d', label: 'Offline' }
        };
        const status = statusMap[discord_status] || statusMap.offline;
        els.activityStatus.textContent = status.label;
        els.activityStatus.style.color = status.color;
        if (els.activityCard) {
            els.activityCard.style.setProperty('--activity-dot', status.color);
        }

        const rpc = activities?.find(a => a.type !== 2 && a.type !== 4) || null;
        const hasSpotify = listening_to_spotify && spotify;
        const hasRpc = !!rpc;

        if (hasSpotify && hasRpc) {
            els.activityCardGrid.classList.add('split');
        } else {
            els.activityCardGrid.classList.remove('split');
        }

        els.activityRpc.innerHTML = '';
        if (hasRpc) {
            let iconUrl = '';
            if (rpc.assets?.large_image) {
                if (rpc.assets.large_image.startsWith('mp:external')) {
                    iconUrl = `https://media.discordapp.net/external/${rpc.assets.large_image.replace('mp:external/', '')}`;
                } else {
                    iconUrl = `https://cdn.discordapp.com/app-assets/${rpc.application_id}/${rpc.assets.large_image}.png`;
                }
            }
            const elapsed = rpc.timestamps?.start ? Date.now() - rpc.timestamps.start : 0;
            els.activityRpc.innerHTML = `
                <div class="activity-item">
                    ${iconUrl ? `<img class="activity-item-icon" src="${iconUrl}" alt="${rpc.name}" onerror="this.style.display='none'">` : '<div class="activity-item-icon activity-item-icon-placeholder"><i class="fa-solid fa-gamepad"></i></div>'}
                    <div class="activity-item-info">
                        <div class="activity-item-label">${getActivityType(rpc.type)} ${rpc.name}</div>
                        ${rpc.details ? `<div class="activity-item-name">${rpc.details}</div>` : ''}
                        ${rpc.state ? `<div class="activity-item-detail">${rpc.state}</div>` : ''}
                        ${rpc.timestamps?.start ? `<div class="activity-item-time"><span class="activity-elapsed" data-start="${rpc.timestamps.start}">${formatTime(elapsed)} elapsed</span></div>` : ''}
                    </div>
                </div>`;
            els.activityRpc.style.display = '';
        } else if (!hasSpotify) {
            els.activityRpc.innerHTML = `<div class="activity-item"><div class="activity-item-info"><div class="activity-item-label" style="color:${status.color}">${status.label}</div><div class="activity-item-detail">No activity</div></div></div>`;
            els.activityRpc.style.display = '';
        } else {
            els.activityRpc.style.display = 'none';
        }

        els.activitySpotify.innerHTML = '';
        if (hasSpotify) {
            const elapsed = Date.now() - spotify.timestamps.start;
            const duration = spotify.timestamps.end - spotify.timestamps.start;
            const progress = Math.min((elapsed / duration) * 100, 100);
            els.activitySpotify.innerHTML = `
                <div class="activity-item">
                    <img class="activity-item-icon" src="${spotify.album_art_url}" alt="${spotify.album}">
                    <div class="activity-item-info">
                        <div class="activity-item-label">Listening on Spotify</div>
                        <div class="activity-item-name">${spotify.song}</div>
                        <div class="activity-item-detail">${spotify.artist}</div>
                        <div class="activity-progress-bar"><div class="activity-progress-fill" data-start="${spotify.timestamps.start}" data-end="${spotify.timestamps.end}" style="width:${progress}%"></div></div>
                        <div class="activity-item-time"><span class="activity-elapsed" data-start="${spotify.timestamps.start}">${formatTime(elapsed)}</span><span>${formatTime(duration)}</span></div>
                    </div>
                </div>`;
            els.activitySpotify.style.display = '';
        } else {
            els.activitySpotify.style.display = 'none';
        }

        elapsedTimer = setInterval(() => {
            document.querySelectorAll('.activity-elapsed').forEach(el => {
                const start = parseInt(el.getAttribute('data-start'));
                if (start) el.textContent = formatTime(Date.now() - start) + ' elapsed';
            });
            document.querySelectorAll('.activity-progress-fill').forEach(el => {
                const start = parseInt(el.getAttribute('data-start'));
                const end = parseInt(el.getAttribute('data-end'));
                if (start && end) {
                    const progress = Math.min(((Date.now() - start) / (end - start)) * 100, 100);
                    el.style.width = progress + '%';
                }
            });
        }, 1000);
    }

    function updateProfile(data) {
        if (!data || !data.discord_user) {
            els.displayName.textContent = 'Không tìm thấy';
            return;
        }
        const { discord_user, discord_status, activities, listening_to_spotify, spotify, badges, connected_accounts, premium_since, premium_guild_since } = data;

        const avatarHash = discord_user.avatar;
        const isGif = avatarHash?.startsWith('a_');
        els.avatar.src = `https://cdn.discordapp.com/avatars/${discord_user.id}/${avatarHash}.${isGif ? 'gif' : 'png'}?size=256`;

        if (discord_user.avatar_decoration_data) {
            els.avatarDecoration.src = `https://cdn.discordapp.com/avatar-decoration-presets/${discord_user.avatar_decoration_data.asset}.png?size=160`;
            els.avatarDecoration.style.display = 'block';
            els.avatarDecoration.onerror = () => { els.avatarDecoration.style.display = 'none'; };
        } else {
            els.avatarDecoration.style.display = 'none';
        }

        if (discord_user.banner) {
            const bannerIsGif = discord_user.banner.startsWith('a_');
            els.banner.style.backgroundImage = `url(https://cdn.discordapp.com/banners/${discord_user.id}/${discord_user.banner}.${bannerIsGif ? 'gif' : 'png'}?size=512)`;
        } else if (discord_user.banner_color) {
            els.banner.style.background = `linear-gradient(135deg, ${discord_user.banner_color}, ${adjustColor(discord_user.banner_color, -30)})`;
        }

        els.displayName.innerHTML = '';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = discord_user.global_name || discord_user.username;
        els.displayName.appendChild(nameSpan);

        const clan = discord_user.clan || discord_user.primary_guild;
        if (clan && clan.tag) {
            const clanBadge = document.createElement('a');
            clanBadge.className = 'discord-clan-tag-badge';
            if (clan.tag.toLowerCase() === 'mumy') {
                clanBadge.href = 'https://discord.gg/mbJHyacpfs';
                clanBadge.target = '_blank';
                clanBadge.rel = 'noopener noreferrer';
            }
            const guildId = clan.identity_guild_id || clan.id;
            let badgeHtml = '';
            if (guildId && clan.badge) {
                badgeHtml = `<img src="https://cdn.discordapp.com/clan-badges/${guildId}/${clan.badge}.png?size=32" class="discord-clan-badge-img" alt="${clan.tag}">`;
            }
            clanBadge.innerHTML = `${badgeHtml}<span>${clan.tag}</span>`;
            clanBadge.title = `Clan: ${clan.tag}`;
            els.displayName.appendChild(clanBadge);
        }

        els.username.textContent = `@${discord_user.username}`;
        els.statusDot.className = `discord-status-dot discord-status-${discord_status}`;

        if (discord_user.bio) {
            els.bio.innerHTML = formatBio(discord_user.bio);
            els.bio.style.display = 'block';
            els.bio.parentElement.style.display = 'block';
        } else {
            els.bio.style.display = 'none';
            els.bio.parentElement.style.display = 'none';
        }

        renderBadges(badges || [], premium_since, premium_guild_since);
        renderConnectedAccounts(connected_accounts || []);
        renderActivities(activities, listening_to_spotify, spotify, discord_status);
    }

    function adaptDcdnProfile(data) {
        const user = data.user || {};
        const userProfile = data.user_profile || {};

        let bannerColor = userProfile.accent_color ?? user.banner_color ?? user.accent_color;
        if (typeof bannerColor === 'number') {
            bannerColor = '#' + bannerColor.toString(16).padStart(6, '0');
        }

        return {
            discord_user: {
                id: user.id,
                username: user.username,
                global_name: user.global_name,
                avatar: user.avatar,
                avatar_decoration_data: user.avatar_decoration_data,
                banner: userProfile.banner || user.banner,
                banner_color: bannerColor,
                bio: userProfile.bio || user.bio,
                clan: user.clan,
                primary_guild: user.primary_guild,
            },
            discord_status: 'offline',
            activities: [],
            listening_to_spotify: false,
            spotify: null,
            badges: data.badges,
            connected_accounts: data.connected_accounts,
            premium_since: data.premium_since,
            premium_guild_since: data.premium_guild_since,
        };
    }

    function fetchWithTimeout(url, ms) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal })
            .finally(() => clearTimeout(timer));
    }

    async function fetchProfile() {
        const [dcdnResult, lanyardResult] = await Promise.allSettled([
            fetchWithTimeout(DCDN_API, 5000).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
            fetchWithTimeout(LANYARD_API, 5000).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        ]);

        let profileData = null;
        let lanyardData = null;

        if (dcdnResult.status === 'fulfilled') {
            profileData = adaptDcdnProfile(dcdnResult.value);
        }
        if (lanyardResult.status === 'fulfilled' && lanyardResult.value.success) {
            lanyardData = lanyardResult.value.data;
        }

        if (profileData && lanyardData) {
            profileData.discord_status = lanyardData.discord_status;
            profileData.activities = lanyardData.activities || [];
            profileData.listening_to_spotify = lanyardData.listening_to_spotify;
            profileData.spotify = lanyardData.spotify;
        } else if (lanyardData) {
            profileData = lanyardData;
        }

        if (profileData) {
            updateProfile(profileData);
        }
    }

    fetchProfile();
    setInterval(fetchProfile, POLL_INTERVAL);
}

function initExperienceCards() {
    const cards = document.querySelectorAll('.exp-card[data-invite]');

    cards.forEach(card => {
        const inviteCode = card.getAttribute('data-invite');
        if (!inviteCode) return;

        const membersEl = card.querySelector('[data-count="members"]');
        const onlineEl = card.querySelector('[data-count="online"]');

        fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true&with_expiration=true`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                const count = data.approximate_member_count;
                const online = data.approximate_presence_count;

                if (membersEl) {
                    membersEl.textContent = count >= 1000
                        ? (count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K+'
                        : count.toLocaleString();
                }
                if (onlineEl) {
                    onlineEl.textContent = online >= 1000
                        ? (online / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
                        : online.toLocaleString();
                }

                if (data.guild && data.guild.icon) {
                    const iconEl = card.querySelector('.exp-icon-wrapper');
                    if (iconEl) {
                        const isGif = data.guild.icon.startsWith('a_');
                        const ext = isGif ? 'gif' : 'png';
                        const imgUrl = `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.${ext}?size=128`;
                        iconEl.innerHTML = `<img src="${imgUrl}" alt="${data.guild.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md)">`;
                    }
                }
            })
            .catch(() => {
                if (membersEl) membersEl.textContent = '—';
                if (onlineEl) onlineEl.textContent = '—';
            });
    });
}

// ============================================
// CHUYỂN NỀN VIDEO -> NỀN TĨNH
// ============================================

function initBgToggle() {
    const bgBtn = document.getElementById('bg-toggle');
    if (!bgBtn) return;

    // Tạo overlay nền tĩnh
    const staticBg = document.createElement('div');
    staticBg.className = 'static-bg';
    staticBg.innerHTML = `
        <div class="static-bg-pattern"></div>
    `;
    document.body.appendChild(staticBg);

    // Kiểm tra trạng thái đã lưu
    const bgState = localStorage.getItem('bg_static');
    if (bgState === 'true') {
        staticBg.classList.add('active');
        bgBtn.classList.add('active');
        document.querySelector('.bg-video').style.display = 'none';
        document.querySelectorAll('.bg-glow').forEach(el => el.style.display = 'none');
    }

    bgBtn.addEventListener('click', () => {
        const isActive = staticBg.classList.toggle('active');
        bgBtn.classList.toggle('active');
        localStorage.setItem('bg_static', isActive);
        
        const video = document.querySelector('.bg-video');
        const glows = document.querySelectorAll('.bg-glow');
        
        if (isActive) {
            // Bật nền tĩnh
            video.style.display = 'none';
            glows.forEach(el => el.style.display = 'none');
        } else {
            // Bật nền video
            video.style.display = 'block';
            glows.forEach(el => el.style.display = 'block');
        }
    });
}