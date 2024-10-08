/*
 * This file was generated by the Gradle 'init' task.
 *
 * This is a general purpose Gradle build.
 * Learn more about Gradle by exploring our samples at https://docs.gradle.org/8.1/samples
 */


plugins {
    application 
    
}

repositories {
    mavenCentral() 
}

dependencies {
    implementation("com.github.javaparser:javaparser-core:3.25.10") 
    
    // https://mvnrepository.com/artifact/com.opencsv/opencsv
    implementation("com.opencsv:opencsv:5.9")
}

application {
    mainClass.set("JavaASTExtract") 
}

// tasks.register<JavaExec>("secondExecutable") {
//     classpath = sourceSets.main.get().runtimeClasspath
//     main = "com.example.SecondMainClass" // Specify the main class for the second executable
// }

sourceSets {
    main {
        java {
            srcDir(".") 
            exclude("open_source_java_projects")
        }
    }
}

//java {
//    toolchain {
//            languageVersion.set(JavaLanguageVersion.of(17))
//    }
//}