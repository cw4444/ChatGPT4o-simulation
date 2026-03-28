# 4o Chat

This is a simple ChatGPT-style app for people who want to talk to `gpt-4o` using their own OpenAI API key.

It includes:

- a clean chat screen
- a place to paste your API key
- a customize box for special instructions
- saved chat history in the sidebar
- local storage in your browser, so your key, chats, and instructions stay there on your own machine

## What You Need

Before you start, make sure you have:

- a computer running Windows, Mac, or Linux
- an OpenAI API key
- Node.js installed

If you do not already have Node.js, install the current LTS version from [nodejs.org](https://nodejs.org/).

## How To Download It From GitHub

### Option 1: The easy way

1. Open the GitHub page for this project.
2. Click the green `Code` button.
3. Click `Download ZIP`.
4. Save the ZIP file somewhere easy to find, like your Desktop or Downloads folder.
5. Unzip it.

### Option 2: Using Git

If you already use Git, open Terminal, PowerShell, or Command Prompt and run:

```bash
git clone https://github.com/cw4444/ChatGPT4o-simulation.git
```

Then go into the folder:

```bash
cd ChatGPT4o-simulation
```

## How To Run It On Your Computer

Open Terminal, PowerShell, or Command Prompt inside the project folder.

Then run:

```bash
npm install
npm run dev
```

Once it starts, open this in your browser:

[http://localhost:5180](http://localhost:5180)

## First-Time Setup Inside The App

1. Open the app in your browser.
2. Click `Customize`.
3. Paste your OpenAI API key into the API key box.
4. If you want, add custom instructions for how the assistant should behave.
5. Start chatting.

## How It Works

- The model is locked to `gpt-4o`.
- Your API key is stored only in your browser on your own computer.
- Your saved chats are also stored in your browser on your own computer.
- Clicking `New chat` starts a fresh conversation.
- Older chats stay in the sidebar so you can reopen them later.

## Important Note

This app uses your own OpenAI API key, so your OpenAI account usage may cost money depending on your plan and how much you use it.

## If Something Is Not Working

Try these steps:

1. Make sure Node.js is installed.
2. Make sure you are running the commands inside the project folder.
3. Make sure `npm run dev` is still running in the terminal.
4. Make sure you opened [http://localhost:5180](http://localhost:5180) and not the raw `index.html` file.
5. If another app is already using that port, stop the other app and try again.

## For People Sharing This With Friends

The easiest setup for most people is:

1. Download the ZIP from GitHub.
2. Unzip it.
3. Open the folder in PowerShell or Terminal.
4. Run `npm install`
5. Run `npm run dev`
6. Open [http://localhost:5180](http://localhost:5180)
7. Paste in their own OpenAI API key

## License

Use, adapt, and share as needed.
