import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from 'sweetalert2'

export function sweetalert(
    options: SweetAlertOptions,
    callback?: (result?: SweetAlertResult<any>) => void
) {
    Swal.fire(options).then(callback);
}

export function swalQuestionTrueFalse(
    title: string | HTMLElement | JQuery,
    icon: SweetAlertIcon,
    html: string | HTMLElement | JQuery,
    then: (result?: SweetAlertResult<any>) => void
) {
    Swal.fire({
        title: title,
        icon: icon,
        html: html,
        confirmButtonText: "Có",
        confirmButtonColor: "#009900",
        showDenyButton: true,
        denyButtonText: "Không",
        denyButtonColor: "#dd3300",
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then(then);
}