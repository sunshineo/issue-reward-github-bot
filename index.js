const axios = require('axios')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {

  // Your code here
  app.log('Yay, the app was loaded!')

  const firtComment = async (issue, context) => {
    const apiUrl = issue.url // https://api.github.com/repos/sunshineo/faqr-portal/issues/23
    const webUrl = 'https://github.com' + apiUrl.substring(28) // https://github.com/sunshineo/faqr-portal/issues/23
    const parseIssueClassUrl = process.env.PARSE_HOST + 'parse/classes/issue'
    const config = {
      headers: {
        'X-Parse-Application-Id': 'ir'
      }
    }

    const query = {
      url: webUrl
    }
    const searchUrl = parseIssueClassUrl + '?where=' + JSON.stringify(query)
    let searchRes
    try {
      searchRes = await axios.get(searchUrl, config)
    }
    catch(e){
      console.log('Failed to search issue on parse.')
      return
    }

    let irId
    const existing = searchRes.data.results
    if (existing.length === 0){
      const body = {
        url: webUrl,
        totalReward: 0,
      }
      let response
      try{
        response = await axios.post(parseIssueClassUrl, body, config)
      }
      catch(e){
        app.log('Failed to post issue to parse.')
        app.log(e)
        return
      }
      irId = response.data.objectId
    }
    else {
      const firstExisting = existing[0]
      irId = firstExisting.objectId
    }
    
    const irUrl = process.env.IR_HOST + 'issue/' + irId
    const parts = apiUrl.split('/')
    const owner = parts[4]
    const repo = parts[5]
    const number = parts[7]
    try {
      await context.github.issues.createComment({
        owner: owner,
        repo: repo,
        number: number,
        body: 'Consider add a reward for this issue to incentivize others fix it faster.\n You can do it here: ' + irUrl
      })
    }
    catch(e){
      // Failed to add comment to an issue
    }
  }

  const initRepositories = async (repositories, context) => {
    for (let i=0; i<repositories.length; i++){
      const repository = repositories[i]
      const full_name = repository.full_name
      const parts = full_name.split('/')
      const owner = parts[0]
      const repo = parts[1]

      try {
        await context.github.issues.createLabel({
          owner: owner,
          repo: repo,
          name: 'has-reward',
          color: '008672', // green
          description: 'Issues with reward',
        })
      }
      catch(e){
        // already has the label, no big deal
        console.log('Failed to create label on repository. They may already have one.')
        console.log(e.errors)
      }

      let res
      try{
        res = await context.github.issues.listForRepo({owner, repo})
      }
      catch(e){
        console.log('Failed to list all the open issues of the repository.')
        console.log(e)
        continue
      }

      const openIssues = res.data
      for (let i=0; i<openIssues.length; i++){
        const issue = openIssues[i]
        await firtComment(issue, context)
      }
    }
  }
  app.on('installation.created', async context => {
    const payload = context.payload
    const repositories = payload.repositories
    await initRepositories(repositories, context)
  })
  app.on('installation_repositories.added', async context => {
    const payload = context.payload
    const repositories = payload.repositories_added
    await initRepositories(repositories, context)
  })

  app.on('issues.opened', async context => {
    app.log('A new issue was opened')
    const payload = context.payload
    const issue = payload.issue
    await firtComment(issue, context)
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
