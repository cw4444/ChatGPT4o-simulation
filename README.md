# 4o Chat

This is a simple ChatGPT-style app for people who want to talk to `gpt-4o` using their own OpenAI API key.

It includes:

- a clean chat screen
- image upload for visual prompts
- a place to paste your API key
- an optional safer server-side key mode
- a customize box for special instructions
- saved chat history in the sidebar
- local storage in your browser, so your key, chats, and instructions stay there on your own machine

## What You Need

Before you start, make sure you have:

- a computer running Windows, Mac, or Linux
- an OpenAI API key
- an OpenAI API account with billing set up
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

## How To Get An OpenAI API Key

If you have never used the OpenAI API before, do this first:

1. Sign in to OpenAI or create an account
2. Go to the API keys page: [Create or manage API keys](https://platform.openai.com/settings/organization/api-keys)
3. Create a new API key
4. Copy it somewhere safe right away

Important:

- treat your API key like a password
- do not post it publicly
- do not send it to other people
- do not put it in screenshots
- you may not be able to view the full key again later, so save it safely when OpenAI shows it

## Billing And Pricing

To use the API, you usually need billing enabled on your OpenAI account.

Useful links:

- [OpenAI API pricing](https://openai.com/api/pricing)
- [Billing overview / balance](https://platform.openai.com/settings/organization/billing/overview)

Plain-English version:

- this is not a giant subscription you accidentally get trapped in
- API use is usually pay-as-you-go
- light casual chatting is often inexpensive
- costs go up if you send lots of messages, very long chats, or lots of images
- always check the official pricing page above for the latest numbers

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

## Two Ways To Use Your API Key

### Option 1: Easy mode

Paste your API key into the app.

- It is saved only in that browser on that computer.
- It is not pushed to GitHub.
- It is not shared with other people automatically.

This is the easiest option for most people using the app locally on their own machine.

### Option 2: More cautious mode

Keep your API key out of the browser completely and store it in a local environment file instead.

1. In the project folder, make a copy of `.env.example`
2. Rename the copy to `.env`
3. Open `.env`
4. Replace the example text with your real OpenAI API key

It should look like this:

```env
OPENAI_API_KEY=sk-your-real-key-here
```

Then start the app the normal way:

```bash
npm install
npm run dev
```

When the server sees `OPENAI_API_KEY`, the app can use that instead of a browser-saved key.

## How It Works

- The model is locked to `gpt-4o`.
- Your API key can be stored either in your browser on your own computer or in a local `.env` file on your own computer.
- Your saved chats are also stored in your browser on your own computer.
- Clicking `New chat` starts a fresh conversation.
- Older chats stay in the sidebar so you can reopen them later.
- You can attach up to 3 images to a message and ask `gpt-4o` about them.

## Important Note

This app uses your own OpenAI API key, so your OpenAI account usage may cost money depending on your plan and how much you use it.

## If Something Is Not Working

Try these steps:

1. Make sure Node.js is installed.
2. Make sure you are running the commands inside the project folder.
3. Make sure `npm run dev` is still running in the terminal.
4. Make sure you opened [http://localhost:5180](http://localhost:5180) and not the raw `index.html` file.
5. If another app is already using that port, stop the other app and try again.
6. If you are using `.env`, make sure the file is named exactly `.env` and that `OPENAI_API_KEY=` is filled in.

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
