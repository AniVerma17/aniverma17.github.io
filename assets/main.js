'use strict';

let pageComponents = {
    home : {
        title : "Animesh Verma -> AniVerma17",
        contentUrl : "content/home_page_content.md"
    },
    profile : {
        title : "Profile | AniVerma17",
        contentUrl : "content/profile_page_content.md"
    }
}

let loadingIndicator
let contentContainer
let blogPostsList = null

window.addEventListener("load", () => {
    loadingIndicator = document.querySelector(".lds-dual-ring")
    contentContainer = document.querySelector("#content")
    document.querySelector("body").classList.add("bg_page_loaded")
    addHistoryState(location.pathname, true)
    document.querySelectorAll("#home_title, #main_menu a").forEach((link) => {
        link.addEventListener("click", event => {
            event.preventDefault()
            let destination = event.target.getAttribute("href")
            addHistoryState(destination, false)
        })
    })
    document.querySelector("footer span").innerHTML = `&copy; ${new Date().getFullYear()} Animesh Verma`
})

window.addEventListener("popstate", (event) => loadSection(event.state))

function addHistoryState(path, isFullPageLoad) {
    let pathSegments = path.split("/").filter((s) => s !== "")
    let pageState = {section: pathSegments[0] ?? "", content: pathSegments[1]}
    if (isFullPageLoad) {
        history.replaceState(pageState, "", path)
    } else {
        history.pushState(pageState, "", path)
    }
    loadSection(pageState)
}

function loadSection(pageState) {
    toggleCurrentLink(pageState.section)
    switch (pageState.section) {
        case "": case "index": case "index.html":
            contentContainer.style.textAlign = "center"
            loadPageWithMarkdown(pageComponents.home)
            break
        case "profile":
            contentContainer.style.textAlign = "left"
            loadPageWithMarkdown(pageComponents.profile)
            break
        case "blog":
            contentContainer.style.textAlign = "left"
            loadBlog(pageState.content)
    }
}

function loadPageWithMarkdown(pageComponent) {
    document.title = pageComponent.title
    contentContainer.innerHTML = ""
    loadingIndicator.style.visibility = "visible"
    setTimeout(() => fetch(pageComponent.contentUrl).then(response => {
            if (response.ok) {
                return response.text()
            }
        }).then(mdText => {
            loadingIndicator.style.visibility = "hidden"
            contentContainer.innerHTML = marked.parse(mdText);
        }),
        1000)
}

function loadBlog(content) {
    contentContainer.innerHTML = ""
    loadingIndicator.style.visibility = "visible"
    setTimeout(() => ((blogPostsList === null) ? fetch("content/blog_list.json").then(response => {
            if (response.ok) {
                blogPostsList = response.json()
                return blogPostsList
            }
        }) : new Promise((resolve, _) => resolve(blogPostsList))
    ).then(function (data) {
        if (content === undefined || content === null || content === "") {
            document.title = "Blog | AniVerma17"
            loadingIndicator.style.visibility = "hidden"
            showAllPosts(data)
        } else {
            let item = data.find(post => post.publicUrl.split("/").pop() === content)
            if (item) {
                let postComponent = {title : `${item.title} | AniVerma17`, contentUrl : item.contentUrl}
                loadPageWithMarkdown(postComponent)
            } else {
                contentContainer.textContent = "404 Not found."
            }
        }
    }), 1000)
}

function showAllPosts(posts) {
    let list = document.createElement("ul")
    list.id = "blogposts"
    contentContainer.append(list)
    posts.forEach(function (item) {
        let listItem = document.createElement("li")
        listItem.classList.add("blog_post")
        listItem.innerHTML = renderPostTemplate(item)
        listItem.querySelector("a").addEventListener("click", event => {
            event.preventDefault()
            addHistoryState(item.publicUrl, false)
        })
        list.append(listItem)
    })
}

function toggleCurrentLink(section) {
    let links = document.querySelectorAll(".link_page")
    for (let link of links) {
        if (section && link.getAttribute("href").includes(section))
            link.classList.add("current_page_link")
        else
            link.classList.remove("current_page_link")
    }
}

function renderPostTemplate(item) {
    let dateFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'}
    let publishDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(new Date(item.publishedOn))
    return `<a href="${item.publicUrl}">
                <img src=\"${item.mainImageUrl}\" />
                <h1>${item.title}</h1>
                <span>${publishDate}</span>
            </a>`
}